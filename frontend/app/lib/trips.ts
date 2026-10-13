// Mirrors backend/app/models/trip.py (camelCase JSON).

export type LegColor = "torii" | "gold" | "ocean" | "sunset" | "teal" | "plum" | "bamboo";
export type ReservationStatus =
  | "idea"
  | "book_now"
  | "backup"
  | "booked"
  | "finalized"
  | "to_cancel"
  | "cancelled";

export type Photo = { url: string; caption?: string | null };
export type Link = { label: string; url: string };

export type Item = {
  id: string;
  title: string;
  tag?: string | null;
  description?: string | null;
  optional: boolean;
  done: boolean;
};

export type Day = {
  id: string;
  date: string;
  title?: string | null;
  stay?: string | null;
  items: Item[];
};

export type Leg = {
  id: string;
  name: string;
  color: LegColor;
  subtitle?: string | null;
  actions: string[];
  photos: Photo[];
  dontMiss: { name: string; text?: string | null }[];
  compareLinks: Link[];
  days: Day[];
};

export type Reservation = {
  id: string;
  kind: string;
  name: string;
  legId?: string | null;
  status: ReservationStatus;
  startDate?: string | null;
  endDate?: string | null;
  datesText?: string | null;
  confirmation?: string | null;
  pin?: string | null;
  url?: string | null;
  typeLabel?: string | null;
  rating?: string | null;
  refundable?: boolean | null;
  cancelBy?: string | null;
  cancelPolicy?: string | null;
  notes?: string | null;
};

export type BudgetLine = {
  id: string;
  category: string;
  basis?: string | null;
  low?: number | null;
  high?: number | null;
};

export type Note = { id: string; title?: string | null; body: string };

export type Trip = {
  id: string;
  title: string;
  subtitle?: string | null;
  origin?: string | null;
  startDate: string;
  endDate: string;
  travelers: number;
  heroPhotos: Photo[];
  intro?: string | null;
  variantGroupId?: string | null;
  variantLabel?: string | null;
  legs: Leg[];
  ideas: Item[];
  reservations: Reservation[];
  budget: BudgetLine[];
  notes: Note[];
  version: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type TripSummary = {
  id: string;
  title: string;
  subtitle?: string | null;
  startDate: string;
  endDate: string;
  variantGroupId?: string | null;
  variantLabel?: string | null;
  itemsTotal: number;
  itemsDone: number;
  updatedAt?: string | null;
};

// Full class names so Tailwind's scanner keeps them.
export const LEG_STYLES: Record<LegColor, { border: string; accent: string; dot: string }> = {
  torii: { border: "border-l-trip-torii", accent: "accent-trip-torii", dot: "bg-trip-torii" },
  gold: { border: "border-l-trip-gold", accent: "accent-trip-gold", dot: "bg-trip-gold" },
  ocean: { border: "border-l-trip-ocean", accent: "accent-trip-ocean", dot: "bg-trip-ocean" },
  sunset: { border: "border-l-trip-sunset", accent: "accent-trip-sunset", dot: "bg-trip-sunset" },
  teal: { border: "border-l-trip-teal", accent: "accent-trip-teal", dot: "bg-trip-teal" },
  plum: { border: "border-l-trip-plum", accent: "accent-trip-plum", dot: "bg-trip-plum" },
  bamboo: { border: "border-l-trip-bamboo", accent: "accent-trip-bamboo", dot: "bg-trip-bamboo" },
};

export const STATUS_ORDER: ReservationStatus[] = [
  "book_now",
  "to_cancel",
  "finalized",
  "booked",
  "backup",
  "idea",
  "cancelled",
];

export const STATUS_STYLES: Record<ReservationStatus, { label: string; className: string }> = {
  book_now: { label: "Book now", className: "bg-orange-100 text-orange-800" },
  to_cancel: { label: "To cancel", className: "bg-red-100 text-red-800" },
  finalized: { label: "Finalized", className: "bg-emerald-100 text-emerald-800" },
  booked: { label: "Booked", className: "bg-sky-100 text-sky-800" },
  backup: { label: "Backup", className: "bg-amber-100 text-amber-800" },
  idea: { label: "Option", className: "bg-stone-100 text-stone-600" },
  cancelled: { label: "Cancelled", className: "bg-stone-100 text-stone-400 line-through" },
};

/** Local-time Date for a YYYY-MM-DD string (avoids the UTC off-by-one). */
function parseDay(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "Wed Nov 18" */
export function formatDay(iso: string): string {
  return parseDay(iso)
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .replace(",", "");
}

/** "Nov 18 – Dec 2, 2026" */
export function formatRange(start: string, end: string): string {
  const s = parseDay(start);
  const e = parseDay(end);
  const short = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const year = e.getFullYear();
  if (start === end) return `${short(s)}, ${year}`;
  const startLabel = s.getFullYear() === year ? short(s) : `${short(s)}, ${s.getFullYear()}`;
  return `${startLabel} – ${short(e)}, ${year}`;
}

export function daysUntil(iso: string): number {
  return Math.round((parseDay(iso).getTime() - parseDay(todayISO()).getTime()) / 86_400_000);
}

export function formatUSD(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatMoneyRange(low?: number | null, high?: number | null): string {
  if (low == null && high == null) return "—";
  if (low == null || high == null || low === high) return formatUSD((low ?? high) as number);
  return `${formatUSD(low)} – ${formatUSD(high)}`;
}

export function dayItems(trip: Trip): Item[] {
  return trip.legs.flatMap((leg) => leg.days.flatMap((day) => day.items));
}

/** Copy of the trip with one item's done flag changed (day items and ideas). */
export function withItemDone(trip: Trip, itemId: string, done: boolean): Trip {
  const update = (items: Item[]) =>
    items.some((i) => i.id === itemId)
      ? items.map((i) => (i.id === itemId ? { ...i, done } : i))
      : items;
  return {
    ...trip,
    legs: trip.legs.map((leg) => ({
      ...leg,
      days: leg.days.map((day) => ({ ...day, items: update(day.items) })),
    })),
    ideas: update(trip.ideas),
  };
}

// --- Editing helpers (also safe on immer drafts) ---

/** Container id for the unscheduled ideas list; day ids are the other containers. */
export const IDEAS = "ideas";

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function newItem(): Item {
  return { id: newId("item"), title: "", optional: false, done: false };
}

export function addDays(iso: string, days: number): string {
  const d = parseDay(iso);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function findDay(trip: Trip, dayId: string): Day | undefined {
  for (const leg of trip.legs) {
    const day = leg.days.find((d) => d.id === dayId);
    if (day) return day;
  }
  return undefined;
}

/** The item array for a container: a day's items, or the ideas list. */
export function itemList(trip: Trip, containerId: string): Item[] | undefined {
  return containerId === IDEAS ? trip.ideas : findDay(trip, containerId)?.items;
}

export function isContainer(trip: Trip, id: string): boolean {
  return id === IDEAS || Boolean(findDay(trip, id));
}

export function containerOf(trip: Trip, itemId: string): string | undefined {
  if (trip.ideas.some((i) => i.id === itemId)) return IDEAS;
  for (const leg of trip.legs) {
    for (const day of leg.days) {
      if (day.items.some((i) => i.id === itemId)) return day.id;
    }
  }
  return undefined;
}

export function findItem(trip: Trip, itemId: string): Item | undefined {
  const containerId = containerOf(trip, itemId);
  return containerId ? itemList(trip, containerId)?.find((i) => i.id === itemId) : undefined;
}

/** Move an item to another container (end of list unless an index is given). Mutates. */
export function moveItem(trip: Trip, itemId: string, toContainer: string, toIndex?: number): void {
  const fromContainer = containerOf(trip, itemId);
  const from = fromContainer && itemList(trip, fromContainer);
  const to = itemList(trip, toContainer);
  if (!from || !to) return;
  const [item] = from.splice(from.findIndex((i) => i.id === itemId), 1);
  to.splice(toIndex ?? to.length, 0, item);
}

/** Move an array element from one index to another. Mutates. */
export function moveInArray<T>(list: T[], from: number, to: number): void {
  if (to < 0 || to >= list.length || from === to) return;
  list.splice(to, 0, list.splice(from, 1)[0]);
}

/** Same rules as the backend model; returns a message for the first problem. */
export function validateTrip(trip: Trip): string | null {
  if (!trip.title.trim()) return "The trip needs a title";
  if (!trip.startDate || !trip.endDate) return "The trip needs start and end dates";
  if (trip.endDate < trip.startDate) return "The trip's end date is before its start date";
  if (!(trip.travelers >= 1)) return "Travelers must be at least 1";
  for (const leg of trip.legs) {
    if (!leg.name.trim()) return "A leg is missing its name";
    for (const day of leg.days) {
      if (!day.date) return `A day in ${leg.name} is missing its date`;
      if (day.items.some((i) => !i.title.trim())) return `An item on ${formatDay(day.date)} has no text yet`;
    }
    if (leg.photos.some((p) => !p.url.trim())) return `A photo in ${leg.name} is missing its URL`;
    if (leg.dontMiss.some((s) => !s.name.trim())) return `A "Don't miss" spot in ${leg.name} has no name`;
    if (leg.compareLinks.some((l) => !l.label.trim() || !l.url.trim())) return `A link in ${leg.name} is incomplete`;
  }
  if (trip.heroPhotos.some((p) => !p.url.trim())) return "A header photo is missing its URL";
  if (trip.ideas.some((i) => !i.title.trim())) return "An idea has no text yet";
  if (trip.reservations.some((r) => !r.name.trim())) return "A reservation is missing its name";
  if (trip.budget.some((b) => !b.category.trim())) return "A budget line is missing its category";
  return null;
}

/** Body for PUT /trips/{id}: the editable fields plus the version we last saw. */
export function toSavePayload(trip: Trip, version: number) {
  const { id: _id, createdAt: _created, updatedAt: _updated, version: _v, ...fields } = trip;
  return { ...fields, version };
}
