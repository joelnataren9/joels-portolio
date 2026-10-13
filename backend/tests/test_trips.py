"""Tests for the private trips API - auth on every route, versioning, item toggles."""

import copy
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core.auth import verify_admin_token
from app.db.data import TripNotFoundError
from app.main import app


class FakeTripStore:
    """In-memory stand-in for the trip functions in app.db.data."""

    def __init__(self):
        self.docs = {}
        self._next = 1

    def list_trips(self):
        return [{**copy.deepcopy(d), "id": k} for k, d in self.docs.items()]

    def get_trip(self, trip_id):
        if trip_id not in self.docs:
            return None
        return {**copy.deepcopy(self.docs[trip_id]), "id": trip_id}

    def create_trip(self, document, trip_id=None):
        trip_id = trip_id or f"trip-{self._next}"
        self._next += 1
        self.docs[trip_id] = {k: v for k, v in copy.deepcopy(document).items() if k != "id"}
        return self.get_trip(trip_id)

    def update_trip(self, trip_id, mutate):
        current = self.get_trip(trip_id)
        if current is None:
            raise TripNotFoundError(trip_id)
        updated = mutate(current)
        self.docs[trip_id] = {k: v for k, v in updated.items() if k != "id"}
        return self.get_trip(trip_id)

    def delete_trip(self, trip_id):
        self.docs.pop(trip_id, None)


@pytest.fixture
def store():
    s = FakeTripStore()
    names = ["list_trips", "get_trip", "create_trip", "update_trip", "delete_trip"]
    patches = [patch(f"app.api.routes.trips.{n}", side_effect=getattr(s, n)) for n in names]
    for p in patches:
        p.start()
    yield s
    for p in patches:
        p.stop()


@pytest.fixture
def client(store):
    """Test client with auth bypassed."""
    async def override():
        return {"sub": "admin@test.com"}
    app.dependency_overrides[verify_admin_token] = override
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def sample_trip():
    return {
        "title": "Japan",
        "startDate": "2026-11-18",
        "endDate": "2026-11-19",
        "travelers": 2,
        "legs": [{
            "id": "tokyo",
            "name": "Tokyo",
            "days": [
                {"id": "d1", "date": "2026-11-18", "items": [{"id": "i1", "title": "Fly SEA to HND"}]},
                {"id": "d2", "date": "2026-11-19", "items": [
                    {"id": "i2", "title": "Senso-ji", "tag": "Temple", "done": True},
                    {"id": "i3", "title": "Skytree"},
                ]},
            ],
        }],
        "ideas": [{"id": "idea1", "title": "Ghibli Museum"}],
        "reservations": [{"id": "r1", "name": "The Knot", "confirmation": "123", "pin": "999"}],
    }


@pytest.mark.parametrize("method,path", [
    ("get", "/trips"),
    ("post", "/trips"),
    ("get", "/trips/t1"),
    ("put", "/trips/t1"),
    ("patch", "/trips/t1/items/i1"),
    ("delete", "/trips/t1"),
])
def test_every_trips_route_requires_auth(store, method, path):
    res = getattr(TestClient(app), method)(path)
    assert res.status_code == 401


def test_create_and_get_round_trip(client):
    res = client.post("/trips", json=sample_trip())
    assert res.status_code == 201
    created = res.json()
    assert created["version"] == 1
    assert created["legs"][0]["days"][1]["items"][0]["tag"] == "Temple"

    fetched = client.get(f"/trips/{created['id']}").json()
    assert fetched == created


def test_create_without_legs_generates_a_day_per_date(client):
    res = client.post("/trips", json={"title": "Weekend", "startDate": "2026-12-30", "endDate": "2027-01-01"})
    days = res.json()["legs"][0]["days"]
    assert [d["date"] for d in days] == ["2026-12-30", "2026-12-31", "2027-01-01"]


def test_create_rejects_end_before_start(client):
    res = client.post("/trips", json={"title": "x", "startDate": "2026-11-20", "endDate": "2026-11-18"})
    assert res.status_code == 422


def test_create_rejects_duplicate_item_ids(client):
    trip = sample_trip()
    trip["ideas"][0]["id"] = "i1"
    assert client.post("/trips", json=trip).status_code == 422


def test_list_returns_progress_without_reservation_details(client):
    client.post("/trips", json=sample_trip())
    res = client.get("/trips")
    assert res.status_code == 200
    [summary] = res.json()
    assert summary["itemsTotal"] == 3  # ideas don't count toward progress
    assert summary["itemsDone"] == 1
    assert "reservations" not in summary
    assert "999" not in res.text


def test_get_missing_trip_is_404(client):
    assert client.get("/trips/nope").status_code == 404


def test_put_with_current_version_saves_and_bumps_version(client, store):
    created = client.post("/trips", json=sample_trip()).json()
    body = {**sample_trip(), "title": "Japan v2", "version": 1}
    res = client.put(f"/trips/{created['id']}", json=body)
    assert res.status_code == 200
    saved = res.json()
    assert saved["title"] == "Japan v2"
    assert saved["version"] == 2
    assert saved["createdAt"] == created["createdAt"]


def test_put_with_stale_version_is_409_and_keeps_data(client, store):
    created = client.post("/trips", json=sample_trip()).json()
    client.put(f"/trips/{created['id']}", json={**sample_trip(), "version": 1})
    res = client.put(f"/trips/{created['id']}", json={**sample_trip(), "title": "stale", "version": 1})
    assert res.status_code == 409
    assert store.docs[created["id"]]["title"] == "Japan"


def test_put_missing_trip_is_404(client):
    assert client.put("/trips/nope", json={**sample_trip(), "version": 1}).status_code == 404


def test_patch_item_toggles_day_item_and_bumps_version(client, store):
    trip_id = client.post("/trips", json=sample_trip()).json()["id"]
    res = client.patch(f"/trips/{trip_id}/items/i3", json={"done": True})
    assert res.status_code == 200
    assert res.json() == {"id": "i3", "done": True, "version": 2}
    assert store.docs[trip_id]["legs"][0]["days"][1]["items"][1]["done"] is True


def test_patch_item_works_for_ideas(client, store):
    trip_id = client.post("/trips", json=sample_trip()).json()["id"]
    assert client.patch(f"/trips/{trip_id}/items/idea1", json={"done": True}).status_code == 200
    assert store.docs[trip_id]["ideas"][0]["done"] is True


def test_tick_then_stale_put_conflicts_instead_of_undoing_tick(client, store):
    trip_id = client.post("/trips", json=sample_trip()).json()["id"]
    client.patch(f"/trips/{trip_id}/items/i3", json={"done": True})  # phone
    res = client.put(f"/trips/{trip_id}", json={**sample_trip(), "version": 1})  # laptop, stale
    assert res.status_code == 409
    assert store.docs[trip_id]["legs"][0]["days"][1]["items"][1]["done"] is True


def test_patch_unknown_item_is_404(client):
    trip_id = client.post("/trips", json=sample_trip()).json()["id"]
    assert client.patch(f"/trips/{trip_id}/items/nope", json={"done": True}).status_code == 404


def test_delete_trip(client, store):
    trip_id = client.post("/trips", json=sample_trip()).json()["id"]
    assert client.delete(f"/trips/{trip_id}").status_code == 204
    assert trip_id not in store.docs
    assert client.delete(f"/trips/{trip_id}").status_code == 404
