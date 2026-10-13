"""Private trip planner. Every endpoint, reads included, requires an admin token."""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import verify_admin_token
from app.db.data import (
    TripNotFoundError,
    create_trip,
    delete_trip,
    get_trip,
    list_trips,
    update_trip,
)
from app.models.trip import (
    Day,
    ItemDoneResult,
    ItemDoneUpdate,
    Leg,
    Trip,
    TripIn,
    TripSummary,
    TripUpdate,
)

# Router-level dependency so a new endpoint can't accidentally ship without auth.
router = APIRouter(dependencies=[Depends(verify_admin_token)])


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")


def default_legs(trip: TripIn) -> List[Leg]:
    """One leg with an empty day per date, for trips created without an itinerary."""
    count = (trip.end_date - trip.start_date).days + 1
    days = [
        Day(id=f"day-{i + 1}", date=trip.start_date + timedelta(days=i))
        for i in range(count)
    ]
    return [Leg(id="leg-1", name=trip.title, days=days)]


def new_trip_document(trip: TripIn) -> Dict[str, Any]:
    """Firestore document for a new trip (also used by scripts/import_trip_html.py)."""
    if not trip.legs:
        trip = trip.model_copy(update={"legs": default_legs(trip)})
    now = _now_iso()
    doc = trip.model_dump(mode="json", by_alias=True)
    doc.update({"version": 1, "createdAt": now, "updatedAt": now})
    return doc


def _find_item(doc: Dict[str, Any], item_id: str) -> Optional[Dict[str, Any]]:
    for leg in doc.get("legs", []):
        for day in leg.get("days", []):
            for item in day.get("items", []):
                if item.get("id") == item_id:
                    return item
    for item in doc.get("ideas", []):
        if item.get("id") == item_id:
            return item
    return None


def _summary(doc: Dict[str, Any]) -> TripSummary:
    trip = Trip.model_validate(doc)
    day_items = [item for leg in trip.legs for day in leg.days for item in day.items]
    return TripSummary(
        id=trip.id,
        title=trip.title,
        subtitle=trip.subtitle,
        start_date=trip.start_date,
        end_date=trip.end_date,
        variant_group_id=trip.variant_group_id,
        variant_label=trip.variant_label,
        items_total=len(day_items),
        items_done=sum(1 for item in day_items if item.done),
        updated_at=trip.updated_at,
    )


@router.get("", response_model=List[TripSummary], summary="List trips (admin)")
async def list_trips_route() -> List[TripSummary]:
    summaries = [_summary(doc) for doc in list_trips()]
    summaries.sort(key=lambda s: s.start_date)
    return summaries


@router.post("", response_model=Trip, status_code=201, summary="Create a trip (admin)")
async def create_trip_route(body: TripIn) -> Trip:
    return Trip.model_validate(create_trip(new_trip_document(body)))


@router.get("/{trip_id}", response_model=Trip, summary="Get a trip (admin)")
async def get_trip_route(trip_id: str) -> Trip:
    doc = get_trip(trip_id)
    if doc is None:
        raise _not_found()
    return Trip.model_validate(doc)


@router.put("/{trip_id}", response_model=Trip, summary="Replace a trip (admin)")
async def update_trip_route(trip_id: str, body: TripUpdate) -> Trip:
    """Full save. body.version must match the stored version, else 409."""

    def mutate(current: Dict[str, Any]) -> Dict[str, Any]:
        current_version = current.get("version", 1)
        if current_version != body.version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Trip was changed elsewhere; reload to get the latest version",
            )
        doc = body.model_dump(mode="json", by_alias=True, exclude={"version"})
        doc.update({
            "version": current_version + 1,
            "createdAt": current.get("createdAt"),
            "updatedAt": _now_iso(),
        })
        return doc

    try:
        return Trip.model_validate(update_trip(trip_id, mutate))
    except TripNotFoundError:
        raise _not_found()


@router.patch(
    "/{trip_id}/items/{item_id}",
    response_model=ItemDoneResult,
    summary="Check or uncheck one item (admin)",
)
async def set_item_done_route(trip_id: str, item_id: str, body: ItemDoneUpdate) -> ItemDoneResult:
    """No version check: ticking boxes on two devices never conflicts. Bumps the
    version so a stale full save (PUT) can't silently undo the tick."""

    def mutate(current: Dict[str, Any]) -> Dict[str, Any]:
        item = _find_item(current, item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
        item["done"] = body.done
        current["version"] = current.get("version", 1) + 1
        current["updatedAt"] = _now_iso()
        return current

    try:
        doc = update_trip(trip_id, mutate)
    except TripNotFoundError:
        raise _not_found()
    return ItemDoneResult(id=item_id, done=body.done, version=doc["version"])


@router.delete("/{trip_id}", status_code=204, summary="Delete a trip (admin)")
async def delete_trip_route(trip_id: str) -> None:
    if get_trip(trip_id) is None:
        raise _not_found()
    delete_trip(trip_id)
