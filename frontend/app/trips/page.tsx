"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminApi } from "@/app/lib/api";
import { type Trip, type TripSummary, addDays, daysUntil, formatRange, todayISO } from "@/app/lib/trips";
import { Progress } from "./components/Progress";

function whenLabel(trip: TripSummary): string | null {
  const days = daysUntil(trip.startDate);
  if (days > 1) return `In ${days} days`;
  if (days === 1) return "Tomorrow";
  if (daysUntil(trip.endDate) >= 0) return "Happening now";
  return null;
}

function TripCard({ trip }: { trip: TripSummary }) {
  const when = whenLabel(trip);
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="block rounded-xl border border-[#ece2d2] bg-white p-5 transition hover:border-stone-300 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span>{formatRange(trip.startDate, trip.endDate)}</span>
        {trip.variantLabel && (
          <span className="rounded-full bg-trip-sand px-2 py-px font-semibold text-[#6b4a2b]">{trip.variantLabel}</span>
        )}
        {when && <span className="font-semibold text-trip-teal">{when}</span>}
      </div>
      <h2 className="mt-1 text-lg font-semibold text-trip-ink">{trip.title}</h2>
      {trip.subtitle && <p className="mt-0.5 line-clamp-2 text-sm text-stone-600">{trip.subtitle}</p>}
      <Progress done={trip.itemsDone} total={trip.itemsTotal} className="mt-3" />
    </Link>
  );
}

const input =
  "w-full rounded-md border border-[#e3d8c6] bg-white px-2.5 py-1.5 text-sm focus:border-trip-teal focus:outline-none focus:ring-1 focus:ring-trip-teal";

/** Title + dates; the backend creates one empty day per date. Opens in edit mode. */
function NewTripForm({ onCancel }: { onCancel: () => void }) {
  const api = useAdminApi();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(() => addDays(todayISO(), 30));
  const [endDate, setEndDate] = useState(() => addDays(todayISO(), 35));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const trip = await api<Trip>("/trips", {
        method: "POST",
        body: JSON.stringify({ title, startDate, endDate, travelers: 1 }),
      });
      router.push(`/trips/${trip.id}?edit=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the trip");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-[#ece2d2] bg-white p-5">
      <label className="block text-xs font-medium text-stone-500">
        Trip name
        <input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Portugal" className={`mt-1 ${input}`} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-stone-500">
          Start
          <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`mt-1 ${input}`} />
        </label>
        <label className="block text-xs font-medium text-stone-500">
          End
          <input required type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`mt-1 ${input}`} />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-trip-teal px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "Creating…" : "Create trip"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function TripsPage() {
  const api = useAdminApi();
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api<TripSummary[]>("/trips")
      .then(setTrips)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load trips"));
  }, [api]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (trips === null) return <p className="text-sm text-stone-500">Loading trips…</p>;

  const today = todayISO();
  const upcoming = trips.filter((t) => t.endDate >= today);
  const past = trips.filter((t) => t.endDate < today).reverse();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-trip-ink">Trips</h1>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-lg bg-trip-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-trip-teal/90"
          >
            New trip
          </button>
        )}
      </div>
      {creating && <NewTripForm onCancel={() => setCreating(false)} />}
      {trips.length === 0 && !creating && (
        <div className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-stone-600">
          <p>No trips yet. Create one with New trip, or import an itinerary HTML file:</p>
          <pre className="mt-2 overflow-x-auto rounded bg-stone-100 p-2 text-xs">
            cd backend && python -m scripts.import_trip_html path/to/itinerary.html
          </pre>
        </div>
      )}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Upcoming</h2>
          {upcoming.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Past</h2>
          {past.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </section>
      )}
    </div>
  );
}
