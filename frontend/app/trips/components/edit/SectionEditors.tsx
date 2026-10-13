"use client";

import {
  type BudgetLine,
  type Note,
  type Reservation,
  type ReservationStatus,
  STATUS_ORDER,
  STATUS_STYLES,
  type Trip,
  moveInArray,
  newId,
} from "@/app/lib/trips";
import { AddButton, Field, MARKDOWN_HINT, RowActions, Select, TextArea, TextInput, orNull } from "./fields";
import type { Update } from "./ItemEditors";

const KINDS = ["lodging", "flight", "train", "activity", "restaurant", "car", "other"];
const heading = "border-b-2 border-trip-sand pb-2 text-[1.4rem] font-semibold";

function ReservationEditor({
  res,
  index,
  trip,
  update,
}: {
  res: Reservation;
  index: number;
  trip: Trip;
  update: Update;
}) {
  const edit = (recipe: (r: Reservation) => void) => update((d) => recipe(d.reservations[index]));
  const text = (key: keyof Reservation, label: string, placeholder = "", className = "") => (
    <Field label={label} className={className}>
      <TextInput
        value={(res[key] as string | null | undefined) ?? ""}
        placeholder={placeholder}
        onChange={(e) => edit((r) => void ((r[key] as string | null) = orNull(e.target.value)))}
      />
    </Field>
  );

  return (
    <li className="space-y-2.5 rounded-lg border border-[#ece2d2] bg-white p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <Field label="Name" className="flex-1">
          <TextInput
            value={res.name}
            placeholder="e.g. Hotel Resol Kyoto"
            onChange={(e) => edit((r) => void (r.name = e.target.value))}
            className="font-semibold"
          />
        </Field>
        <RowActions
          what="reservation"
          onDelete={() => {
            if (confirm(`Delete reservation "${res.name || "untitled"}"?`)) update((d) => void d.reservations.splice(index, 1));
          }}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Field label="Status">
          <Select value={res.status} onChange={(e) => edit((r) => void (r.status = e.target.value as ReservationStatus))}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_STYLES[s].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={res.kind} onChange={(e) => edit((r) => void (r.kind = e.target.value))}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k[0].toUpperCase() + k.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Leg">
          <Select value={res.legId ?? ""} onChange={(e) => edit((r) => void (r.legId = orNull(e.target.value)))}>
            <option value="">—</option>
            {trip.legs.map((leg) => (
              <option key={leg.id} value={leg.id}>
                {leg.name || "Untitled leg"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start">
          <TextInput type="date" value={res.startDate ?? ""} onChange={(e) => edit((r) => void (r.startDate = orNull(e.target.value)))} />
        </Field>
        <Field label="End">
          <TextInput type="date" value={res.endDate ?? ""} onChange={(e) => edit((r) => void (r.endDate = orNull(e.target.value)))} />
        </Field>
        <Field label="Refundable">
          <Select
            value={res.refundable == null ? "" : String(res.refundable)}
            onChange={(e) => edit((r) => void (r.refundable = e.target.value === "" ? null : e.target.value === "true"))}
          >
            <option value="">Unknown</option>
            <option value="true">Yes, free cancellation</option>
            <option value="false">No</option>
          </Select>
        </Field>
        {text("confirmation", "Confirmation #")}
        {text("pin", "PIN")}
        <Field label="Cancel by">
          <TextInput type="date" value={res.cancelBy ?? ""} onChange={(e) => edit((r) => void (r.cancelBy = orNull(e.target.value)))} />
        </Field>
        {text("url", "Booking link", "https://…", "sm:col-span-2")}
        {text("rating", "Rating", "e.g. 9.1/10")}
        {text("typeLabel", "Kind of place", "e.g. Ryokan, Gora", "sm:col-span-3")}
      </div>
      <Field label="Dates note">
        <TextArea
          value={res.datesText ?? ""}
          placeholder="Shown instead of the dates, e.g. needs extending to Nov 23"
          onChange={(e) => edit((r) => void (r.datesText = orNull(e.target.value)))}
        />
      </Field>
      <Field label="Cancellation policy">
        <TextArea value={res.cancelPolicy ?? ""} onChange={(e) => edit((r) => void (r.cancelPolicy = orNull(e.target.value)))} />
      </Field>
      <Field label="Notes">
        <TextArea
          value={res.notes ?? ""}
          placeholder={MARKDOWN_HINT}
          onChange={(e) => edit((r) => void (r.notes = orNull(e.target.value)))}
        />
      </Field>
    </li>
  );
}

export function ReservationsEditor({ trip, update }: { trip: Trip; update: Update }) {
  return (
    <section id="reservations" className="scroll-mt-24 space-y-3">
      <h2 className={heading}>Reservations</h2>
      <ul className="space-y-3">
        {trip.reservations.map((res, i) => (
          <ReservationEditor key={res.id} res={res} index={i} trip={trip} update={update} />
        ))}
      </ul>
      <AddButton
        onClick={() =>
          update((d) => void d.reservations.unshift({ id: newId("res"), kind: "lodging", name: "", status: "idea" }))
        }
      >
        Add reservation
      </AddButton>
    </section>
  );
}

export function BudgetEditor({ trip, update }: { trip: Trip; update: Update }) {
  const lines = trip.budget;
  const num = (v: string) => (v === "" ? null : Number(v));
  const edit = (i: number, recipe: (b: BudgetLine) => void) => update((d) => recipe(d.budget[i]));
  return (
    <section id="budget" className="scroll-mt-24 space-y-3">
      <h2 className={heading}>
        Budget <span className="text-base font-normal text-stone-500">(USD per person)</span>
      </h2>
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li key={line.id} className="flex items-start gap-2 rounded-md border border-[#ece2d2] bg-white p-2">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5 sm:grid-cols-[2fr_1fr_90px_90px]">
              <TextInput
                value={line.category}
                placeholder="Category"
                onChange={(e) => edit(i, (b) => void (b.category = e.target.value))}
                className="col-span-2 sm:col-span-1"
                aria-label="Category"
              />
              <TextInput
                value={line.basis ?? ""}
                placeholder="Basis"
                onChange={(e) => edit(i, (b) => void (b.basis = orNull(e.target.value)))}
                className="col-span-2 sm:col-span-1"
                aria-label="Basis"
              />
              <TextInput
                type="number"
                min={0}
                value={line.low ?? ""}
                placeholder="Low $"
                onChange={(e) => edit(i, (b) => void (b.low = num(e.target.value)))}
                aria-label="Low estimate"
              />
              <TextInput
                type="number"
                min={0}
                value={line.high ?? ""}
                placeholder="High $"
                onChange={(e) => edit(i, (b) => void (b.high = num(e.target.value)))}
                aria-label="High estimate"
              />
            </div>
            <RowActions
              what="budget line"
              onUp={i > 0 ? () => update((d) => moveInArray(d.budget, i, i - 1)) : undefined}
              onDown={i < lines.length - 1 ? () => update((d) => moveInArray(d.budget, i, i + 1)) : undefined}
              onDelete={() => update((d) => void d.budget.splice(i, 1))}
            />
          </li>
        ))}
      </ul>
      <AddButton onClick={() => update((d) => void d.budget.push({ id: newId("budget"), category: "", low: null, high: null }))}>
        Add budget line
      </AddButton>
    </section>
  );
}

export function NotesEditor({ trip, update }: { trip: Trip; update: Update }) {
  const notes = trip.notes;
  const edit = (i: number, recipe: (n: Note) => void) => update((d) => recipe(d.notes[i]));
  return (
    <section id="notes" className="scroll-mt-24 space-y-3">
      <h2 className={heading}>Notes</h2>
      <ul className="space-y-2">
        {notes.map((note, i) => (
          <li key={note.id} className="flex items-start gap-2 rounded-lg border border-[#ecdcb8] bg-[#fbf3e3] p-2.5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <TextInput
                value={note.title ?? ""}
                placeholder="Title"
                onChange={(e) => edit(i, (n) => void (n.title = orNull(e.target.value)))}
                className="font-semibold"
                aria-label="Note title"
              />
              <TextArea
                value={note.body}
                placeholder={MARKDOWN_HINT}
                onChange={(e) => edit(i, (n) => void (n.body = e.target.value))}
                aria-label="Note"
              />
            </div>
            <RowActions
              what="note"
              onUp={i > 0 ? () => update((d) => moveInArray(d.notes, i, i - 1)) : undefined}
              onDown={i < notes.length - 1 ? () => update((d) => moveInArray(d.notes, i, i + 1)) : undefined}
              onDelete={() => update((d) => void d.notes.splice(i, 1))}
            />
          </li>
        ))}
      </ul>
      <AddButton onClick={() => update((d) => void d.notes.push({ id: newId("note"), title: null, body: "" }))}>Add note</AddButton>
    </section>
  );
}
