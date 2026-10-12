"use client";

import { IDEAS, LEG_STYLES, type Trip, newId } from "@/app/lib/trips";
import { AddButton, Field, Group, MARKDOWN_HINT, TextArea, TextInput, orNull } from "./fields";
import { ItemList, ItemsDnd, type Toggle, type Update, moveOptions } from "./ItemEditors";
import { LegEditor, PhotosEditor } from "./LegEditor";
import { BudgetEditor, NotesEditor, ReservationsEditor } from "./SectionEditors";

export function TripEditor({
  trip,
  update,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  trip: Trip;
  update: Update;
  onToggle: Toggle;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-24 text-trip-ink">
      <section className="space-y-3 rounded-xl bg-gradient-to-b from-trip-sky to-trip-paper p-4 sm:p-5">
        <Field label="Trip title">
          <TextInput
            value={trip.title}
            onChange={(e) => update((d) => void (d.title = e.target.value))}
            className="text-lg font-bold"
          />
        </Field>
        <Field label="Subtitle">
          <TextArea value={trip.subtitle ?? ""} onChange={(e) => update((d) => void (d.subtitle = orNull(e.target.value)))} />
        </Field>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Field label="Start">
            <TextInput type="date" value={trip.startDate} onChange={(e) => update((d) => void (d.startDate = e.target.value))} />
          </Field>
          <Field label="End">
            <TextInput type="date" value={trip.endDate} onChange={(e) => update((d) => void (d.endDate = e.target.value))} />
          </Field>
          <Field label="Travelers">
            <TextInput
              type="number"
              min={1}
              value={trip.travelers}
              onChange={(e) => update((d) => void (d.travelers = Number(e.target.value)))}
            />
          </Field>
          <Field label="Departing from">
            <TextInput value={trip.origin ?? ""} onChange={(e) => update((d) => void (d.origin = orNull(e.target.value)))} />
          </Field>
          <Field label="Version label">
            <TextInput
              value={trip.variantLabel ?? ""}
              placeholder="e.g. No Okinawa"
              onChange={(e) => update((d) => void (d.variantLabel = orNull(e.target.value)))}
            />
          </Field>
        </div>
        <Field label="Intro">
          <TextArea
            value={trip.intro ?? ""}
            placeholder={`The idea behind this trip. ${MARKDOWN_HINT}, ## Heading`}
            onChange={(e) => update((d) => void (d.intro = orNull(e.target.value)))}
            className="min-h-[80px]"
          />
        </Field>
        <Group title="Header photos" count={trip.heroPhotos.length}>
          <PhotosEditor photos={trip.heroPhotos} update={update} get={(d) => d.heroPhotos} />
        </Group>
      </section>

      <ItemsDnd trip={trip} update={update}>
        <div className="space-y-6">
          {trip.legs.map((leg, i) => (
            <LegEditor key={leg.id} trip={trip} leg={leg} legIndex={i} update={update} onToggle={onToggle} />
          ))}
          <AddButton
            onClick={() =>
              update((d) =>
                void d.legs.push({
                  id: newId("leg"),
                  name: "",
                  color: "torii",
                  actions: [],
                  photos: [],
                  dontMiss: [],
                  compareLinks: [],
                  days: [],
                }),
              )
            }
          >
            Add leg
          </AddButton>
        </div>

        <section id="ideas" className="scroll-mt-24 space-y-3">
          <h2 className="border-b-2 border-trip-sand pb-2 text-[1.4rem] font-semibold">Ideas to swap in</h2>
          <p className="text-sm text-stone-500">Drag ideas onto a day when you decide to do them, or park items here.</p>
          <ItemList
            containerId={IDEAS}
            items={trip.ideas}
            accent={LEG_STYLES.torii.accent}
            options={moveOptions(trip)}
            update={update}
            onToggle={onToggle}
            addLabel="Add idea"
          />
        </section>
      </ItemsDnd>

      <ReservationsEditor trip={trip} update={update} />
      <BudgetEditor trip={trip} update={update} />
      <NotesEditor trip={trip} update={update} />

      <section className="flex flex-wrap gap-3 border-t border-[#ece2d2] pt-6">
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-400"
        >
          Duplicate as a new version
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete trip
        </button>
      </section>
    </div>
  );
}
