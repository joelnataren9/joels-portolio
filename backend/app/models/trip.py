"""Private trip planner models. Stored as one Firestore document per trip (camelCase)."""

from datetime import date
from typing import Iterator, List, Literal, Optional, Set

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

LegColor = Literal["torii", "gold", "ocean", "sunset", "teal", "plum", "bamboo"]
ReservationKind = Literal["lodging", "flight", "train", "activity", "restaurant", "car", "other"]
# idea: considered, not held · backup: held but not the pick · finalized: the pick used in the plan
ReservationStatus = Literal[
    "idea", "book_now", "backup", "booked", "finalized", "to_cancel", "cancelled"
]


class _Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Photo(_Camel):
    url: str
    caption: Optional[str] = None


class Link(_Camel):
    label: str
    url: str


class DontMiss(_Camel):
    name: str
    text: Optional[str] = None  # markdown


class Item(_Camel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)  # markdown (inline links/bold)
    tag: Optional[str] = None
    description: Optional[str] = None  # markdown
    optional: bool = False
    done: bool = False


class Day(_Camel):
    id: str = Field(min_length=1)
    date: date
    title: Optional[str] = None
    stay: Optional[str] = None  # markdown badge, e.g. "Check in: **Hotel**"
    items: List[Item] = Field(default_factory=list)


class Leg(_Camel):
    id: str = Field(min_length=1)
    name: str
    color: LegColor = "torii"
    subtitle: Optional[str] = None  # markdown
    actions: List[str] = Field(default_factory=list)  # markdown "action needed" callouts
    photos: List[Photo] = Field(default_factory=list)
    dont_miss: List[DontMiss] = Field(default_factory=list)
    compare_links: List[Link] = Field(default_factory=list)
    days: List[Day] = Field(default_factory=list)


class Reservation(_Camel):
    id: str = Field(min_length=1)
    kind: ReservationKind = "lodging"
    name: str
    leg_id: Optional[str] = None
    status: ReservationStatus = "idea"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    dates_text: Optional[str] = None  # free-form when dates aren't exact
    confirmation: Optional[str] = None
    pin: Optional[str] = None
    url: Optional[str] = None
    type_label: Optional[str] = None  # e.g. "Ryokan, Gora"
    rating: Optional[str] = None
    refundable: Optional[bool] = None
    cancel_by: Optional[date] = None
    cancel_policy: Optional[str] = None  # markdown
    notes: Optional[str] = None  # markdown


class BudgetLine(_Camel):
    id: str = Field(min_length=1)
    category: str
    basis: Optional[str] = None
    low: Optional[float] = None  # USD per person
    high: Optional[float] = None


class Note(_Camel):
    id: str = Field(min_length=1)
    title: Optional[str] = None
    body: str  # markdown


class Checklist(_Camel):
    """A free-standing checklist, e.g. "Things to pack"."""
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    items: List[Item] = Field(default_factory=list)


# Sections that always exist; legs and checklists are collapsible by their own id.
FIXED_SECTIONS = ("ideas", "reservations", "budget", "notes")


class TripIn(_Camel):
    title: str = Field(min_length=1)
    subtitle: Optional[str] = None
    origin: Optional[str] = None
    start_date: date
    end_date: date
    travelers: int = Field(default=1, ge=1)
    hero_photos: List[Photo] = Field(default_factory=list)
    intro: Optional[str] = None  # markdown
    variant_group_id: Optional[str] = None
    variant_label: Optional[str] = None
    legs: List[Leg] = Field(default_factory=list)
    ideas: List[Item] = Field(default_factory=list)
    reservations: List[Reservation] = Field(default_factory=list)
    budget: List[BudgetLine] = Field(default_factory=list)
    notes: List[Note] = Field(default_factory=list)
    checklists: List[Checklist] = Field(default_factory=list)
    # Ids of sections folded shut in the trip view (shared by everyone who opens it).
    collapsed_sections: List[str] = Field(default_factory=list, max_length=500)

    @model_validator(mode="after")
    def _check(self) -> "TripIn":
        if self.end_date < self.start_date:
            raise ValueError("endDate must be on or after startDate")
        ids = [item.id for item in iter_items(self)]
        if len(ids) != len(set(ids)):
            raise ValueError("Item ids must be unique within a trip")
        list_ids = [c.id for c in self.checklists]
        if len(list_ids) != len(set(list_ids)):
            raise ValueError("Checklist ids must be unique within a trip")
        # Forget folds for sections that no longer exist (deleted legs/lists).
        sections = section_ids(self)
        self.collapsed_sections = [s for s in dict.fromkeys(self.collapsed_sections) if s in sections]
        return self


class TripUpdate(TripIn):
    version: int  # version the client last loaded; stale saves get 409


class Trip(TripIn):
    id: str
    version: int = 1
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TripSummary(_Camel):
    id: str
    title: str
    subtitle: Optional[str] = None
    start_date: date
    end_date: date
    variant_group_id: Optional[str] = None
    variant_label: Optional[str] = None
    items_total: int = 0
    items_done: int = 0
    updated_at: Optional[str] = None


class ItemDoneUpdate(_Camel):
    done: bool


class ItemDoneResult(_Camel):
    id: str
    done: bool
    version: int


class SectionCollapsedUpdate(_Camel):
    collapsed: bool


class SectionCollapsedResult(_Camel):
    id: str
    collapsed: bool
    version: int


def iter_items(trip: TripIn) -> Iterator[Item]:
    """Every checkable item in a trip: day items in order, then ideas, then checklists."""
    for leg in trip.legs:
        for day in leg.days:
            yield from day.items
    yield from trip.ideas
    for checklist in trip.checklists:
        yield from checklist.items


def section_ids(trip: TripIn) -> Set[str]:
    """Ids of every section that can be collapsed in the trip view."""
    return {*FIXED_SECTIONS, *(leg.id for leg in trip.legs), *(c.id for c in trip.checklists)}
