"""Tests for scripts/import_trip_html.py against a trimmed copy of the itinerary layout."""

import pytest

pytest.importorskip("bs4")

from app.models.trip import TripIn  # noqa: E402
from scripts.import_trip_html import carry_over_checks, parse_range, parse_trip_html, status_from  # noqa: E402

HTML = """
<html><head><title>Japan Trip (No Okinawa): Tokyo + Kyoto</title></head><body>
<header class="hero">
  <h1>Tokyo &middot; Kyoto</h1>
  <p>Dec 30, 2026 &ndash; Jan 2 &middot; Departing Seattle &middot; foliage</p>
  <div class="hero-strip"><img src="https://img/a.jpg" alt="Shibuya"></div>
</header>
<div class="wrap">
<section><h2 class="region">The shape of this version</h2><p>Why we go.</p></section>
<section>
  <h2 class="region">Tokyo</h2>
  <p class="region-sub">Dec 30 &ndash; Jan 1 &middot; The Knot &middot; <b>Booking.com conf #: 1234567890 &middot; PIN: 4321</b></p>
  <div class="note-box"><strong>Action needed:</strong> Extend <b>The Knot</b>.</div>
  <div class="food-box"><b class="hd">Don't miss</b><ul>
    <li><b>Omoide Yokocho</b> (Shinjuku) &mdash; yakitori alley.</li>
    <li>If offered, an <b>irori course</b> is great.</li>
  </ul></div>
  <div class="day">
    <div class="day-header"><div class="date">Wed Dec 30 (holiday) &mdash; Arrive</div>
    <div class="stay-badge">Check in: <b>The Knot</b><br>Boutique hotel</div></div>
    <ul class="checklist">
      <li><input type="checkbox"> Land HND</li>
      <li><input type="checkbox" checked> <b>Tea BOOKED.</b> Pair with Byodo-in <span class="tag">Temple</span>. Done.</li>
      <li class="row"><input type="checkbox"><span class="place"><i>Optional:</i> Ueno Park &mdash; <a href="https://x.test">map</a></span><span class="tag">Park</span><span class="desc">big park</span></li>
    </ul>
  </div>
</section>
<section>
  <h2 class="region">Kyoto</h2>
  <div class="day kyoto"><div class="day-header"><div class="date">Fri Jan 1 &mdash; New Year</div></div>
    <ul class="checklist"><li><input type="checkbox"> Shrine visit</li></ul></div>
</section>
<section><h2 class="region">Other famous spots you could swap in</h2><ul class="swaps">
  <li><strong>Ghibli Museum</strong> (Tokyo) &mdash; whimsical museum.</li>
</ul></section>
<section><h2 class="region">Where to Stay</h2>
  <table><tr><th>Region</th><th>Pick</th><th>Type</th><th>Rating</th><th>Why / notes</th><th>Book</th></tr>
  <tr><td>Tokyo</td><td><b>THE KNOT TOKYO</b></td><td>Boutique</td><td>9/10</td><td>Roomy.</td><td><a href="https://book.test/knot">Booking</a></td></tr></table>
</section>
<section><h2 class="region">Current Reservations</h2>
  <table><tr><th>Property</th><th>Dates</th><th>Confirmation</th><th>Status</th><th>Cancellation deadline</th></tr>
  <tr><td><b>The Knot Tokyo</b></td><td>Dec 30 &ndash; Jan 1 (2 nights)</td><td>conf #: <b>1234567890</b> &middot; PIN: <b>4321</b></td><td>Finalized &mdash; Tokyo (others are now backups)</td><td>Verify refundable.</td></tr>
  <tr><td><b>Daiichi Hotel Tokyo</b></td><td>Dec 30 &ndash; 31</td><td>&mdash;</td><td>Backup/overlap &mdash; overlaps the finalized Knot stay</td><td></td></tr>
  </table>
  <p><strong>Standing rule:</strong> holds must be refundable.</p>
</section>
<section><h2 class="region">Rough Budget &mdash; 2 travelers, 1 shared room (USD)</h2>
  <table><tr><th>Category</th><th>Basis</th><th>Per person</th></tr>
  <tr><td>Flight</td><td>each person</td><td>$900 &ndash; $1,100</td></tr>
  <tr><td>Hotel</td><td>1 room</td><td>~$320</td></tr>
  <tr class="total-row"><td colspan="2">Total</td><td>~$1,220</td></tr></table>
</section>
<section><h2 class="region">Practical notes</h2><div class="note-box"><ul>
  <li><strong>JR Pass:</strong> buy individually.</li>
</ul></div></section>
</div></body></html>
"""


@pytest.fixture
def trip():
    return parse_trip_html(HTML)


def test_parsed_trip_is_valid(trip):
    TripIn.model_validate(trip)


def test_hero_and_dates_roll_over_new_year(trip):
    assert trip["title"] == "Tokyo · Kyoto"
    assert trip["origin"] == "Seattle"
    assert trip["variantLabel"] == "No Okinawa"
    assert (trip["startDate"], trip["endDate"]) == ("2026-12-30", "2027-01-01")
    assert trip["travelers"] == 2


def test_leg_details(trip):
    tokyo, kyoto = trip["legs"]
    assert tokyo["actions"] == ["Extend **The Knot**."]
    assert tokyo["dontMiss"][0] == {"name": "Omoide Yokocho", "text": "(Shinjuku) — yakitori alley."}
    assert tokyo["dontMiss"][1]["text"] is None  # bold not at the start: keep the sentence whole
    assert kyoto["color"] == "gold"


def test_day_and_items(trip):
    day = trip["legs"][0]["days"][0]
    assert day["title"] == "Arrive (holiday)"
    assert day["stay"] == "Check in: **The Knot**  \nBoutique hotel"
    simple, booked, row = day["items"]
    assert simple["title"] == "Land HND" and not simple["done"]
    assert booked["done"] and booked["tag"] == "Temple"
    assert booked["title"] == "**Tea BOOKED.** Pair with Byodo-in. Done."
    assert row["optional"] and row["title"] == "Ueno Park — [map](https://x.test)"
    assert (row["tag"], row["description"]) == ("Park", "big park")


def test_pin_only_kept_on_reservation(trip):
    knot = trip["reservations"][0]
    assert (knot["confirmation"], knot["pin"]) == ("1234567890", "4321")
    tokyo_sub = trip["legs"][0]["subtitle"]
    assert "4321" not in tokyo_sub and "1234567890" not in tokyo_sub


def test_reservations_merge_where_to_stay_and_table(trip):
    knot, daiichi = trip["reservations"]
    assert knot["name"] == "THE KNOT TOKYO"  # merged, not duplicated
    assert knot["status"] == "finalized"
    assert knot["url"] == "https://book.test/knot"
    assert knot["legId"] == trip["legs"][0]["id"]
    assert (knot["startDate"], knot["endDate"]) == ("2026-12-30", "2027-01-01")
    assert daiichi["status"] == "backup"


def test_ideas_budget_notes(trip):
    assert trip["ideas"][0]["title"] == "Ghibli Museum (Tokyo)"
    assert trip["ideas"][0]["description"] == "whimsical museum."
    assert [(b["low"], b["high"]) for b in trip["budget"]] == [(900, 1100), (320, 320)]
    titles = [n["title"] for n in trip["notes"]]
    assert "JR Pass" in titles and "Reservations: Standing rule" in titles


@pytest.mark.parametrize("text,expected", [
    ("Finalized — Tokyo (overlaps X, which are now backups)", "finalized"),
    ("Backup/overlap — overlaps the finalized stay", "backup"),
    ("CANCEL — that night is now in Tokyo", "to_cancel"),
    ("Cancelled", "cancelled"),
    ("BOOK NOW — Kyoto", "book_now"),
    ("No longer the pick — superseded", "idea"),
])
def test_status_from(text, expected):
    assert status_from(text) == expected


def test_parse_range_formats():
    assert [d.isoformat() for d in parse_range("Nov 29 – Dec 1 (2 nights)", 2026)] == ["2026-11-29", "2026-12-01"]
    assert [d.isoformat() for d in parse_range("Check in Thu, Nov 19 → Sat, Nov 21", 2026)] == ["2026-11-19", "2026-11-21"]
    assert parse_range("Dates not provided", 2026) == (None, None)


def test_reimport_keeps_checkmarks(trip):
    old = parse_trip_html(HTML)
    old["legs"][0]["days"][0]["items"][0]["done"] = True
    assert carry_over_checks(trip, old) == 1
    assert trip["legs"][0]["days"][0]["items"][0]["done"]
