"""Import an itinerary HTML page (the Japan_Trip_Itinerary_*.html layout) as a trip.

Run from backend/ (needs beautifulsoup4, a dev dependency, plus the same Firebase
credentials as sync_blog):

    python -m scripts.import_trip_html PATH.html --dry-run [--out trip.json]
    python -m scripts.import_trip_html PATH.html                    # create a new trip
    python -m scripts.import_trip_html PATH.html --replace TRIP_ID  # re-import, keeping checkmarks
"""

import argparse
import json
import re
import sys
from collections import Counter
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from bs4 import BeautifulSoup, NavigableString, Tag

MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
MONTH_DAY = re.compile(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?,?\s+(\d{1,2})\b")
DATE_RANGE = re.compile(
    r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})\s*[–-]\s*"
    r"(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{1,2})\b"
)
# .day modifier classes in the itinerary CSS -> app leg colors
DAY_CLASS_COLORS = {"kyoto": "gold", "miyajima": "ocean", "osaka": "sunset", "hakone": "teal", "kanazawa": "plum"}
_BR = " "  # survives whitespace collapsing, becomes a markdown hard break
# Booking PINs live on the reservation (hidden in the UI), so strip them from display text.
_CONF_AND_PIN = re.compile(r"\s*·?\s*\*{0,2}[^·*\n]*conf[^·*\n]*#:?\s*\d{6,}\s*·\s*PIN:?\s*\w+\*{0,2}", re.I)
_PIN = re.compile(r"\bPIN:\s*\**\w+\**", re.I)


# --- HTML -> markdown -------------------------------------------------------

def _wrap(text: str, mark: str) -> str:
    stripped = text.strip()
    if not stripped:
        return text
    lead = text[: len(text) - len(text.lstrip())]
    trail = text[len(text.rstrip()):]
    return f"{lead}{mark}{stripped}{mark}{trail}"


def to_md(node: Any) -> str:
    """Convert an HTML fragment to markdown, keeping bold/italic/links/line breaks."""
    if isinstance(node, NavigableString):
        return re.sub(r"\s+", " ", str(node))
    if not isinstance(node, Tag) or node.name in ("input", "img", "script", "style"):
        return ""
    inner = "".join(to_md(child) for child in node.children)
    name = node.name
    if name in ("b", "strong"):
        if "hd" in (node.get("class") or []):
            return f"**{inner.strip()}**\n\n"
        return _wrap(inner, "**")
    if name in ("i", "em"):
        return _wrap(inner, "*")
    if name == "s":
        return _wrap(inner, "~~")
    if name == "a":
        href = node.get("href")
        return f"[{inner.strip()}]({href})" if href else inner
    if name == "br":
        return _BR
    if name == "li":
        return f"- {inner.strip()}\n"
    if name in ("ul", "ol"):
        return f"\n{inner}\n"
    if name in ("p", "div", "section", "h3"):
        return f"{inner.strip()}\n\n"
    return inner


def clean(md: str) -> str:
    md = re.sub(r"[ \t]+", " ", md)
    md = re.sub(r" *\n *", "\n", md)
    md = re.sub(r"\n{3,}", "\n\n", md)
    md = re.sub(r" +([.,;])", r"\1", md)
    md = _PIN.sub("PIN saved in Reservations", _CONF_AND_PIN.sub("", md))
    return md.replace(f" {_BR}", _BR).replace(_BR, "  \n").strip()


def md(node: Optional[Tag]) -> Optional[str]:
    if node is None:
        return None
    text = clean(to_md(node))
    return text or None


def md_inner(node: Optional[Tag]) -> Optional[str]:
    """Like md(), but for an element's contents (an <li> without its "- " bullet)."""
    if node is None:
        return None
    text = clean("".join(to_md(child) for child in node.children))
    return text or None


def photo_url(url: str) -> str:
    """Wikimedia only serves standard thumbnail widths now (1000px returns 400)."""
    return re.sub(r"(upload\.wikimedia\.org/.+/thumb/.+/)\d+px-", r"\g<1>960px-", url)


def text_of(node: Optional[Tag]) -> str:
    return re.sub(r"\s+", " ", node.get_text(" ", strip=True)) if node else ""


def _strip_lead_dash(text: str) -> str:
    return re.sub(r"^[\s—–-]+", "", text).strip()


# --- dates & matching -------------------------------------------------------

class DateParser:
    """Month/day strings -> dates, rolling the year forward across New Year."""

    def __init__(self, year: int):
        self.year = year
        self.last: Optional[date] = None

    def make(self, month: str, day: str) -> date:
        value = date(self.year, MONTHS.index(month[:3].lower()) + 1, int(day))
        if self.last and (self.last - value).days > 180:
            self.year += 1
            value = value.replace(year=self.year)
        self.last = value
        return value

    def find(self, text: str) -> Optional[date]:
        m = MONTH_DAY.search(text)
        return self.make(m.group(1), m.group(2)) if m else None


def parse_range(text: str, year: int) -> Tuple[Optional[date], Optional[date]]:
    parser = DateParser(year)
    m = DATE_RANGE.search(text)
    if m:
        start = parser.make(m.group(1), m.group(2))
        return start, parser.make(m.group(3) or m.group(1), m.group(4))
    found = MONTH_DAY.findall(text)
    if len(found) >= 2:
        return parser.make(*found[0]), parser.make(*found[1])
    return None, None


def _tokens(text: str) -> set:
    return set(re.findall(r"[a-z]+", text.lower())) - {"and", "the", "hotel", "hotels", "of"}


def match_leg(text: str, legs: List[Dict[str, Any]]) -> Optional[str]:
    words = _tokens(text)
    for leg in legs:
        if words & _tokens(leg["name"]):
            return leg["id"]
    return None


def norm_name(name: str) -> str:
    name = re.sub(r"\([^)]*\)", "", name.lower())
    name = re.split(r"\s[—–]\s", name)[0]
    return re.sub(r"[^a-z0-9]", "", name)


# Longer phrases first so "cancelled" wins over "cancel" at the same position.
STATUS_WORDS = [
    ("cancelled", "cancelled"), ("canceled", "cancelled"), ("cancel", "to_cancel"),
    ("book now", "book_now"), ("finalized", "finalized"), ("backup", "backup"),
    ("no longer", "idea"), ("booked", "booked"), ("confirmed", "booked"),
]


def status_from(text: str) -> str:
    """Status from whichever keyword appears first: "Backup — overlaps the finalized
    stay" is a backup, "Finalized (other holds are now backups)" is finalized."""
    t = text.lower()
    hits = [(t.find(word), i, status) for i, (word, status) in enumerate(STATUS_WORDS) if word in t]
    return min(hits)[2] if hits else "idea"


def parse_money(text: str) -> Tuple[Optional[float], Optional[float]]:
    nums = [float(n.replace(",", "")) for n in re.findall(r"\$\s?([\d,]+(?:\.\d+)?)", text)]
    if not nums:
        return None, None
    return nums[0], nums[1] if len(nums) > 1 else nums[0]


# --- page sections ----------------------------------------------------------

class TripBuilder:
    def __init__(self, soup: BeautifulSoup):
        self.soup = soup
        hero_text = text_of(soup.select_one("header.hero p"))
        year_match = re.search(r"\b(20\d\d)\b", hero_text)
        self.year = int(year_match.group(1)) if year_match else datetime.utcnow().year
        self.dates = DateParser(self.year)
        self.counters: Counter = Counter()
        self.trip: Dict[str, Any] = {
            "legs": [], "ideas": [], "reservations": [], "budget": [], "notes": [], "travelers": 1,
        }

    def next_id(self, kind: str) -> str:
        self.counters[kind] += 1
        return f"{kind}-{self.counters[kind]}"

    def note(self, title: Optional[str], body: Optional[str]) -> None:
        if body:
            self.trip["notes"].append({"id": self.next_id("note"), "title": title, "body": body})

    def build(self) -> Dict[str, Any]:
        self.parse_hero()
        sections = self.soup.select("div.wrap > section") or self.soup.select("section")
        deferred = []
        for section in sections:
            heading = text_of(section.find("h2"))
            h = heading.lower()
            if section.select(".day"):
                self.parse_leg(section, heading)
            elif "swap" in h:
                self.parse_ideas(section)
            elif "where to stay" in h or "reservation" in h:
                deferred.append(section)  # needs legs parsed first
            elif "budget" in h:
                self.parse_budget(section, heading)
            elif "practical" in h:
                self.parse_practical(section)
            elif self.trip.get("intro") is None and not self.trip["legs"]:
                body = clean("".join(to_md(c) for c in section.children if getattr(c, "name", None) != "h2"))
                self.trip["intro"] = f"## {heading}\n\n{body}" if heading else body
            else:
                self.note(heading or None, md(section))
        for section in deferred:
            if "where to stay" in text_of(section.find("h2")).lower():
                self.parse_where_to_stay(section)
        for section in deferred:
            if "reservation" in text_of(section.find("h2")).lower():
                self.parse_reservations(section)

        all_dates = [d["date"] for leg in self.trip["legs"] for d in leg["days"]]
        if all_dates:
            self.trip["startDate"] = min(all_dates).isoformat()
            self.trip["endDate"] = max(all_dates).isoformat()
        for leg in self.trip["legs"]:
            for day in leg["days"]:
                day["date"] = day["date"].isoformat()
        return self.trip

    def parse_hero(self) -> None:
        hero = self.soup.select_one("header.hero")
        title_tag = text_of(self.soup.find("title"))
        self.trip["title"] = text_of(hero.find("h1")) if hero else title_tag or "Imported trip"
        subtitle = text_of(hero.find("p")) if hero else ""
        self.trip["subtitle"] = subtitle or None
        origin = re.search(r"Departing ([^·]+)", subtitle)
        self.trip["origin"] = origin.group(1).strip() if origin else None
        variant = re.search(r"\(([^)]+)\)", title_tag)
        self.trip["variantLabel"] = variant.group(1) if variant else None
        self.trip["heroPhotos"] = [
            {"url": photo_url(img["src"]), "caption": img.get("alt")}
            for img in (hero.select(".hero-strip img") if hero else [])
            if img.get("src")
        ]

    def parse_item(self, li: Tag) -> Dict[str, Any]:
        checkbox = li.find("input", {"type": "checkbox"})
        item: Dict[str, Any] = {"id": self.next_id("item"), "done": bool(checkbox and checkbox.has_attr("checked"))}
        if "row" in (li.get("class") or []):
            item["title"] = md(li.select_one(".place")) or text_of(li)
            item["tag"] = text_of(li.select_one(".tag")) or None
            item["description"] = md(li.select_one(".desc"))
        else:
            tag = li.select_one(".tag")
            item["tag"] = text_of(tag) or None
            if tag:
                tag.extract()
            item["title"] = md_inner(li) or "(untitled)"
        optional = re.match(r"^\*Optional:?\*:?\s*", item["title"])
        item["optional"] = bool(optional)
        if optional:
            item["title"] = item["title"][optional.end():]
        return item

    def parse_leg(self, section: Tag, name: str) -> None:
        leg_id = self.next_id("leg")
        first_day = section.select_one(".day")
        classes = [c for c in (first_day.get("class") or []) if c != "day"] if first_day else []
        leg: Dict[str, Any] = {
            "id": leg_id,
            "name": name,
            "color": next((DAY_CLASS_COLORS[c] for c in classes if c in DAY_CLASS_COLORS), "torii"),
            "subtitle": md(section.select_one(".region-sub")),
            "actions": [
                re.sub(r"^\*\*Action needed:?\*\*:?\s*", "", md(box) or "")
                for box in section.find_all("div", class_="note-box", recursive=False)
            ],
            "photos": [
                {"url": photo_url(fig.find("img")["src"]), "caption": text_of(fig.find("figcaption")) or None}
                for fig in section.select(".photo-strip figure")
                if fig.find("img") and fig.find("img").get("src")
            ],
            "dontMiss": [self.parse_dont_miss(li) for li in section.select(".food-box li")],
            "compareLinks": [],
            "days": [],
        }
        for day_el in section.select(".day"):
            label = text_of(day_el.select_one(".date"))
            when, _, title = label.partition(" — ")
            extra = re.findall(r"\(([^)]*)\)", when)
            title = title.strip() or None
            if extra:
                title = f"{title} ({', '.join(extra)})" if title else ", ".join(extra)
            day_date = self.dates.find(when) or self.dates.last
            leg["days"].append({
                "id": self.next_id("day"),
                "date": day_date,
                "title": title,
                "stay": md(day_el.select_one(".stay-badge")),
                "items": [self.parse_item(li) for li in day_el.select(".checklist > li")],
            })
        self.trip["legs"].append(leg)

    def parse_dont_miss(self, li: Tag) -> Dict[str, Any]:
        bold = li.find("b")
        if bold and text_of(li).startswith(text_of(bold)):
            name = text_of(bold)
            bold.extract()
            return {"name": name, "text": _strip_lead_dash(md_inner(li) or "") or None}
        return {"name": md_inner(li) or text_of(li), "text": None}

    def parse_ideas(self, section: Tag) -> None:
        for li in section.select("li"):
            strong = li.find("strong")
            title = text_of(strong) if strong else ""
            if strong:
                strong.extract()
            rest = md_inner(li) or ""
            where = re.match(r"^(\([^)]*\))\s*", rest)
            if where:
                title = f"{title} {where.group(1)}".strip()
                rest = rest[where.end():]
            self.trip["ideas"].append({
                "id": self.next_id("idea"),
                "title": title or rest,
                "description": _strip_lead_dash(rest) if title else None,
            })

    def _reservation(self, name: str) -> Dict[str, Any]:
        key = norm_name(name)
        for res in self.trip["reservations"]:
            other = norm_name(res["name"])
            if key and other and (key.startswith(other) or other.startswith(key)):
                return res
        res = {"id": self.next_id("res"), "kind": "lodging", "name": name, "status": "idea"}
        self.trip["reservations"].append(res)
        return res

    def parse_where_to_stay(self, section: Tag) -> None:
        last_h3 = None
        for el in section.find_all(["table", "h3", "div"], recursive=False):
            if el.name == "h3":
                last_h3 = text_of(el)
            elif el.name == "div" and "note-box" in (el.get("class") or []):
                self.note(last_h3, md(el))
            elif el.name == "table":
                headers = [text_of(th).lower() for th in el.select("tr th")]
                rows = [tr.find_all("td") for tr in el.find_all("tr") if tr.find_all("td")]
                if "pick" in headers:
                    for tds in rows:
                        self._stay_pick(dict(zip(headers, tds)))
                elif any("airbnb" in h or "compare" in h for h in headers):
                    for tds in rows:
                        leg_id = match_leg(text_of(tds[0]), self.trip["legs"])
                        leg = next((l for l in self.trip["legs"] if l["id"] == leg_id), None)
                        if leg is not None:
                            leg["compareLinks"] += [
                                {"label": text_of(a), "url": a["href"]}
                                for td in tds[1:] for a in td.find_all("a", href=True)
                            ]

    def _stay_pick(self, cells: Dict[str, Tag]) -> None:
        pick = cells.get("pick")
        if pick is None:
            return
        bold = pick.find("b")
        res = self._reservation(text_of(bold) if bold else text_of(pick))
        res["legId"] = match_leg(text_of(cells.get("region")), self.trip["legs"])
        res["typeLabel"] = text_of(cells.get("type")) or None
        res["rating"] = text_of(cells.get("rating")) or None
        notes = [md(cells.get("why / notes"))]
        book = cells.get("book")
        link = book.find("a", href=True) if book else None
        if link:
            res["url"] = link["href"]
        elif book is not None:
            notes.append(md(book))
        res["notes"] = "\n\n".join(n for n in notes if n) or None
        if "finalized" in text_of(pick).lower():
            res["status"] = "finalized"

    def parse_reservations(self, section: Tag) -> None:
        table = section.find("table")
        if table is not None:
            headers = [text_of(th).lower() for th in table.select("tr th")]
            for tr in table.find_all("tr"):
                tds = tr.find_all("td")
                if not tds:
                    continue
                cells = dict(zip(headers, tds))
                res = self._reservation(text_of(cells.get("property", tds[0])))
                res["leg_hint"] = text_of(cells.get("property", tds[0]))
                res["status"] = status_from(text_of(cells.get("status")))
                dates_text = text_of(cells.get("dates"))
                start, end = parse_range(dates_text, self.year)
                res["startDate"] = start.isoformat() if start else None
                res["endDate"] = end.isoformat() if end else None
                res["datesText"] = md(cells.get("dates"))
                self._confirmation(res, cells.get("confirmation"))
                res["cancelPolicy"] = md(cells.get("cancellation deadline"))
        for p in section.find_all("p", recursive=False):
            strong = p.find("strong")
            if strong and text_of(p).startswith(text_of(strong)):
                title = text_of(strong).rstrip(":")
                strong.extract()
                self.note(f"Reservations: {title}", md(p))
        for res in self.trip["reservations"]:
            hint = res.pop("leg_hint", None)
            if not res.get("legId"):
                res["legId"] = match_leg(hint or res["name"], self.trip["legs"])

    def _confirmation(self, res: Dict[str, Any], cell: Optional[Tag]) -> None:
        if cell is None:
            return
        text = text_of(cell)
        pin = re.search(r"PIN:?\s*(\w+)", text)
        number = re.search(r"(\d{6,})", text)
        if pin:
            res["pin"] = pin.group(1)
        if number:
            res["confirmation"] = number.group(1)
        link = cell.find("a", href=True)
        if link and not res.get("url"):
            res["url"] = link["href"]
        if not number and text not in ("", "—", "-", "Not booked"):
            res["notes"] = "\n\n".join(n for n in (res.get("notes"), md(cell)) if n)

    def parse_budget(self, section: Tag, heading: str) -> None:
        travelers = re.search(r"(\d+)\s+travel", heading)
        if travelers:
            self.trip["travelers"] = int(travelers.group(1))
        table = section.find("table")
        for tr in table.find_all("tr") if table else []:
            tds = tr.find_all("td")
            if len(tds) < 3 or "total-row" in (tr.get("class") or []):
                continue
            low, high = parse_money(text_of(tds[2]))
            self.trip["budget"].append({
                "id": self.next_id("budget"),
                "category": text_of(tds[0]),
                "basis": text_of(tds[1]) or None,
                "low": low,
                "high": high,
            })
        for p in section.find_all("p", recursive=False):
            strong = p.find("strong")
            title = text_of(strong).rstrip(":") if strong else None
            if strong:
                strong.extract()
            self.note(f"Budget: {title}" if title else "Budget", md(p))

    def parse_practical(self, section: Tag) -> None:
        for li in section.select(".note-box li"):
            strong = li.find("strong")
            title = text_of(strong).rstrip(":") if strong else None
            if strong:
                strong.extract()
            self.note(title, _strip_lead_dash(md_inner(li) or ""))


def parse_trip_html(html: str) -> Dict[str, Any]:
    return TripBuilder(BeautifulSoup(html, "html.parser")).build()


# --- CLI --------------------------------------------------------------------

def _norm_title(text: Optional[str]) -> str:
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def carry_over_checks(new_doc: Dict[str, Any], old_doc: Dict[str, Any]) -> int:
    """Copy done flags from the stored trip onto matching (date, title) items."""
    def keyed(doc: Dict[str, Any]) -> Iterable[Tuple[Tuple[str, str], Dict[str, Any]]]:
        for leg in doc.get("legs", []):
            for day in leg.get("days", []):
                for item in day.get("items", []):
                    yield (day.get("date"), _norm_title(item.get("title"))), item
        for item in doc.get("ideas", []):
            yield ("idea", _norm_title(item.get("title"))), item

    done = {key for key, item in keyed(old_doc) if item.get("done")}
    carried = 0
    for key, item in keyed(new_doc):
        if key in done and not item.get("done"):
            item["done"] = True
            carried += 1
    return carried


def summarize(doc: Dict[str, Any]) -> str:
    days = [d for leg in doc["legs"] for d in leg["days"]]
    items = [i for d in days for i in d["items"]]
    statuses = Counter(r["status"] for r in doc["reservations"])
    return (
        f"{doc['title']} ({doc.get('variantLabel') or 'no variant'}): "
        f"{doc['startDate']} → {doc['endDate']}, {doc['travelers']} travelers\n"
        f"  {len(doc['legs'])} legs, {len(days)} days, {len(items)} items "
        f"({sum(i['done'] for i in items)} done), {len(doc['ideas'])} ideas\n"
        f"  {len(doc['reservations'])} reservations {dict(statuses)}, "
        f"{len(doc['budget'])} budget lines, {len(doc['notes'])} notes"
    )


def main(argv: Optional[List[str]] = None) -> None:
    parser = argparse.ArgumentParser(description="Import an itinerary HTML file as a trip.")
    parser.add_argument("html", type=Path)
    parser.add_argument("--dry-run", action="store_true", help="print the trip JSON, write nothing")
    parser.add_argument("--out", type=Path, help="with --dry-run, write JSON here instead of stdout")
    parser.add_argument("--replace", metavar="TRIP_ID", help="overwrite this trip, keeping checkmarks")
    parser.add_argument("--title")
    parser.add_argument("--variant-label")
    parser.add_argument("--variant-group")
    args = parser.parse_args(argv)

    # Imported here so --dry-run works without Firebase settings.
    from app.api.routes.trips import new_trip_document
    from app.models.trip import TripIn

    raw = parse_trip_html(args.html.read_text(encoding="utf-8"))
    for key, value in (("title", args.title), ("variantLabel", args.variant_label), ("variantGroupId", args.variant_group)):
        if value:
            raw[key] = value
    doc = new_trip_document(TripIn.model_validate(raw))
    print(summarize(doc), file=sys.stderr)

    if args.dry_run:
        text = json.dumps(doc, indent=2, ensure_ascii=False)
        if args.out:
            args.out.write_text(text, encoding="utf-8")
            print(f"Wrote {args.out}", file=sys.stderr)
        else:
            print(text)
        return

    from dotenv import load_dotenv

    load_dotenv()
    from app.db.data import create_trip, update_trip

    if args.replace:
        def mutate(current: Dict[str, Any]) -> Dict[str, Any]:
            replaced = json.loads(json.dumps(doc))
            carry_over_checks(replaced, current)
            replaced.update({
                "version": current.get("version", 1) + 1,
                "createdAt": current.get("createdAt") or doc["createdAt"],
            })
            return replaced

        saved = update_trip(args.replace, mutate)
        print(f"Replaced trip {saved['id']} (version {saved['version']})", file=sys.stderr)
    else:
        saved = create_trip(doc)
        print(f"Created trip {saved['id']}", file=sys.stderr)


if __name__ == "__main__":
    main()
