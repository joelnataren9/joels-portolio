"use client";

import { useState, type ReactNode } from "react";
import {
  type Leg,
  type Reservation,
  type ReservationStatus,
  STATUS_ORDER,
  STATUS_STYLES,
  formatRange,
} from "@/app/lib/trips";
import { Md } from "./Md";

const GROUPS: { title: string; statuses: ReservationStatus[] }[] = [
  { title: "Needs action", statuses: ["book_now", "to_cancel"] },
  { title: "Locked in", statuses: ["finalized", "booked"] },
  { title: "Backups (cancel before the free-cancellation deadline)", statuses: ["backup"] },
  { title: "Other options", statuses: ["idea"] },
  { title: "Cancelled", statuses: ["cancelled"] },
];

/** Confirmation numbers and PINs stay masked until you ask for them. */
function Secret({ value }: { value: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setShown(true);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3">
      <span className="font-mono">{shown ? value : "••••••"}</span>
      <button type="button" onClick={() => setShown((s) => !s)} className="text-xs text-trip-ocean underline">
        {shown ? "Hide" : "Show"}
      </button>
      <button type="button" onClick={copy} className="text-xs text-trip-ocean underline">
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-stone-500">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

function ReservationCard({ res, legName }: { res: Reservation; legName?: string }) {
  const status = STATUS_STYLES[res.status];
  const dates =
    res.datesText || (res.startDate && res.endDate ? formatRange(res.startDate, res.endDate) : null);
  const muted = res.status === "cancelled" ? "opacity-60" : "";

  return (
    <li className={`rounded-lg border border-[#ece2d2] bg-white p-4 ${muted}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-trip-ink">{res.name}</p>
          <p className="text-xs text-stone-500">{[legName, res.typeLabel].filter(Boolean).join(" · ")}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
      </div>
      <dl className="mt-2.5 grid grid-cols-[96px_1fr] gap-x-3 gap-y-1 text-sm">
        {dates && (
          <Field label="Dates">
            <Md inline>{dates}</Md>
          </Field>
        )}
        {res.rating && <Field label="Rating">{res.rating}</Field>}
        {res.confirmation && (
          <Field label="Confirmation">
            <Secret value={res.confirmation} />
          </Field>
        )}
        {res.pin && (
          <Field label="PIN">
            <Secret value={res.pin} />
          </Field>
        )}
        {res.cancelPolicy && (
          <Field label="Cancellation">
            <Md inline>{res.cancelPolicy}</Md>
          </Field>
        )}
      </dl>
      {res.notes && <Md className="mt-2 text-stone-600">{res.notes}</Md>}
      {res.url && (
        <a
          href={res.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-trip-ocean hover:underline"
        >
          Open booking ↗
        </a>
      )}
    </li>
  );
}

export function Reservations({ reservations, legs }: { reservations: Reservation[]; legs: Leg[] }) {
  if (reservations.length === 0) return null;
  const legNames = Object.fromEntries(legs.map((leg) => [leg.id, leg.name]));
  const sorted = [...reservations].sort(
    (a, b) =>
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
      (a.startDate ?? "9999").localeCompare(b.startDate ?? "9999"),
  );

  return (
    <section id="reservations" className="scroll-mt-24">
      <h2 className="border-b-2 border-trip-sand pb-2 text-[1.4rem] font-semibold">Reservations</h2>
      {GROUPS.map(({ title, statuses }) => {
        const group = sorted.filter((r) => statuses.includes(r.status));
        if (group.length === 0) return null;
        return (
          <div key={title} className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              {title} <span className="font-normal">({group.length})</span>
            </h3>
            <ul className="mt-2 grid gap-3 md:grid-cols-2">
              {group.map((res) => (
                <ReservationCard key={res.id} res={res} legName={res.legId ? legNames[res.legId] : undefined} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
