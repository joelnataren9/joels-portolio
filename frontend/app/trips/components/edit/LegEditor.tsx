"use client";

import {
  type Day,
  type Leg,
  type LegColor,
  LEG_STYLES,
  type Photo,
  type Trip,
  addDays,
  moveInArray,
  newId,
} from "@/app/lib/trips";
import { AddButton, Field, Group, MARKDOWN_HINT, RowActions, Select, TextArea, TextInput, orNull } from "./fields";
import { ItemList, type Toggle, type Update, moveOptions } from "./ItemEditors";

const COLORS = Object.keys(LEG_STYLES) as LegColor[];

/** Editable list of {url, caption} photos; `get` finds the array on the draft. */
export function PhotosEditor({
  photos,
  update,
  get,
}: {
  photos: Photo[];
  update: Update;
  get: (draft: Trip) => Photo[];
}) {
  return (
    <>
      {photos.map((photo, i) => (
        <div key={i} className="flex items-start gap-2">
          {photo.url && <img src={photo.url} alt="" className="mt-0.5 h-9 w-12 shrink-0 rounded object-cover" />}
          <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-[2fr_1fr]">
            <TextInput
              value={photo.url}
              placeholder="Image URL (https://…)"
              onChange={(e) => update((d) => void (get(d)[i].url = e.target.value))}
              aria-label="Image URL"
            />
            <TextInput
              value={photo.caption ?? ""}
              placeholder="Caption"
              onChange={(e) => update((d) => void (get(d)[i].caption = orNull(e.target.value)))}
              aria-label="Caption"
            />
          </div>
          <RowActions
            what="photo"
            onUp={i > 0 ? () => update((d) => moveInArray(get(d), i, i - 1)) : undefined}
            onDown={i < photos.length - 1 ? () => update((d) => moveInArray(get(d), i, i + 1)) : undefined}
            onDelete={() => update((d) => void get(d).splice(i, 1))}
          />
        </div>
      ))}
      <AddButton onClick={() => update((d) => void get(d).push({ url: "", caption: null }))}>Add photo</AddButton>
    </>
  );
}

function DayEditor({
  trip,
  leg,
  legIndex,
  day,
  dayIndex,
  update,
  onToggle,
  options,
}: {
  trip: Trip;
  leg: Leg;
  legIndex: number;
  day: Day;
  dayIndex: number;
  update: Update;
  onToggle: Toggle;
  options: ReturnType<typeof moveOptions>;
}) {
  const style = LEG_STYLES[leg.color];
  const days = (d: Trip) => d.legs[legIndex].days;
  const editDay = (recipe: (draft: Day) => void) => update((d) => recipe(days(d)[dayIndex]));

  return (
    <article className={`space-y-2.5 rounded-lg border border-l-4 border-[#ece2d2] ${style.border} bg-white p-3 sm:p-4`}>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Date" className="w-[150px]">
          <TextInput type="date" value={day.date} onChange={(e) => editDay((x) => void (x.date = e.target.value))} />
        </Field>
        <Field label="Day title" className="min-w-[180px] flex-1">
          <TextInput
            value={day.title ?? ""}
            placeholder="e.g. Tokyo → Kyoto"
            onChange={(e) => editDay((x) => void (x.title = orNull(e.target.value)))}
          />
        </Field>
        <RowActions
          what="day"
          onUp={dayIndex > 0 ? () => update((d) => moveInArray(days(d), dayIndex, dayIndex - 1)) : undefined}
          onDown={
            dayIndex < leg.days.length - 1 ? () => update((d) => moveInArray(days(d), dayIndex, dayIndex + 1)) : undefined
          }
          onDelete={() => {
            if (day.items.length && !confirm(`Delete this day and its ${day.items.length} items?`)) return;
            update((d) => void days(d).splice(dayIndex, 1));
          }}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
        <Field label="Where you sleep (badge)">
          <TextArea
            value={day.stay ?? ""}
            placeholder="e.g. Check in: **Hotel name**"
            onChange={(e) => editDay((x) => void (x.stay = orNull(e.target.value)))}
          />
        </Field>
        {trip.legs.length > 1 && (
          <Field label="Move day to leg">
            <Select
              value={leg.id}
              onChange={(e) =>
                update((d) => {
                  const [moved] = days(d).splice(dayIndex, 1);
                  d.legs.find((l) => l.id === e.target.value)?.days.push(moved);
                })
              }
            >
              {trip.legs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name || "Untitled leg"}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <ItemList
        containerId={day.id}
        items={day.items}
        accent={style.accent}
        options={options}
        update={update}
        onToggle={onToggle}
      />
    </article>
  );
}

export function LegEditor({
  trip,
  leg,
  legIndex,
  update,
  onToggle,
}: {
  trip: Trip;
  leg: Leg;
  legIndex: number;
  update: Update;
  onToggle: Toggle;
}) {
  const options = moveOptions(trip);
  const legOf = (d: Trip) => d.legs[legIndex];
  const editLeg = (recipe: (draft: Leg) => void) => update((d) => recipe(legOf(d)));
  const lastDate = leg.days[leg.days.length - 1]?.date;

  return (
    <section id={leg.id} className="scroll-mt-24 space-y-3 rounded-xl border border-[#ece2d2] bg-[#fdfaf5] p-3 sm:p-4">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Leg" className="min-w-[180px] flex-1">
          <TextInput
            value={leg.name}
            placeholder="e.g. Kyoto"
            onChange={(e) => editLeg((l) => void (l.name = e.target.value))}
            className="text-base font-semibold"
          />
        </Field>
        <div className="flex items-center gap-1 pb-1.5" role="radiogroup" aria-label="Leg color">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={leg.color === color}
              aria-label={color}
              title={color}
              onClick={() => editLeg((l) => void (l.color = color))}
              className={`h-5 w-5 rounded-full ${LEG_STYLES[color].dot} ${
                leg.color === color ? "ring-2 ring-stone-700 ring-offset-1" : ""
              }`}
            />
          ))}
        </div>
        <RowActions
          what="leg"
          onUp={legIndex > 0 ? () => update((d) => moveInArray(d.legs, legIndex, legIndex - 1)) : undefined}
          onDown={
            legIndex < trip.legs.length - 1 ? () => update((d) => moveInArray(d.legs, legIndex, legIndex + 1)) : undefined
          }
          onDelete={() => {
            const items = leg.days.reduce((n, day) => n + day.items.length, 0);
            if (leg.days.length && !confirm(`Delete ${leg.name || "this leg"} with ${leg.days.length} days and ${items} items?`)) return;
            update((d) => void d.legs.splice(legIndex, 1));
          }}
        />
      </div>
      <Field label="Subtitle">
        <TextInput
          value={leg.subtitle ?? ""}
          placeholder="e.g. Nov 23 – 28 · 5 nights · Hotel name"
          onChange={(e) => editLeg((l) => void (l.subtitle = orNull(e.target.value)))}
        />
      </Field>

      <Group title="Action needed" count={leg.actions.length}>
        {leg.actions.map((action, i) => (
          <div key={i} className="flex items-start gap-2">
            <TextArea
              value={action}
              placeholder={MARKDOWN_HINT}
              onChange={(e) => editLeg((l) => void (l.actions[i] = e.target.value))}
              aria-label="Action needed"
            />
            <RowActions
              what="action"
              onUp={i > 0 ? () => editLeg((l) => moveInArray(l.actions, i, i - 1)) : undefined}
              onDown={i < leg.actions.length - 1 ? () => editLeg((l) => moveInArray(l.actions, i, i + 1)) : undefined}
              onDelete={() => editLeg((l) => void l.actions.splice(i, 1))}
            />
          </div>
        ))}
        <AddButton onClick={() => editLeg((l) => void l.actions.push(""))}>Add action</AddButton>
      </Group>

      <Group title="Photos" count={leg.photos.length}>
        <PhotosEditor photos={leg.photos} update={update} get={(d) => legOf(d).photos} />
      </Group>

      <Group title="Don't miss" count={leg.dontMiss.length}>
        {leg.dontMiss.map((spot, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-[180px_1fr]">
              <TextInput
                value={spot.name}
                placeholder="Place"
                onChange={(e) => editLeg((l) => void (l.dontMiss[i].name = e.target.value))}
                aria-label="Place"
              />
              <TextArea
                value={spot.text ?? ""}
                placeholder="Why it's worth it"
                onChange={(e) => editLeg((l) => void (l.dontMiss[i].text = orNull(e.target.value)))}
                aria-label="Why it's worth it"
              />
            </div>
            <RowActions
              what="spot"
              onUp={i > 0 ? () => editLeg((l) => moveInArray(l.dontMiss, i, i - 1)) : undefined}
              onDown={i < leg.dontMiss.length - 1 ? () => editLeg((l) => moveInArray(l.dontMiss, i, i + 1)) : undefined}
              onDelete={() => editLeg((l) => void l.dontMiss.splice(i, 1))}
            />
          </div>
        ))}
        <AddButton onClick={() => editLeg((l) => void l.dontMiss.push({ name: "", text: null }))}>Add spot</AddButton>
      </Group>

      <Group title="Compare-stays links" count={leg.compareLinks.length}>
        {leg.compareLinks.map((link, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-[1fr_2fr]">
              <TextInput
                value={link.label}
                placeholder="Label"
                onChange={(e) => editLeg((l) => void (l.compareLinks[i].label = e.target.value))}
                aria-label="Link label"
              />
              <TextInput
                value={link.url}
                placeholder="https://…"
                onChange={(e) => editLeg((l) => void (l.compareLinks[i].url = e.target.value))}
                aria-label="Link URL"
              />
            </div>
            <RowActions what="link" onDelete={() => editLeg((l) => void l.compareLinks.splice(i, 1))} />
          </div>
        ))}
        <AddButton onClick={() => editLeg((l) => void l.compareLinks.push({ label: "", url: "" }))}>Add link</AddButton>
      </Group>

      <div className="space-y-3">
        {leg.days.map((day, dayIndex) => (
          <DayEditor
            key={day.id}
            trip={trip}
            leg={leg}
            legIndex={legIndex}
            day={day}
            dayIndex={dayIndex}
            update={update}
            onToggle={onToggle}
            options={options}
          />
        ))}
      </div>
      <AddButton
        onClick={() =>
          editLeg((l) =>
            void l.days.push({
              id: newId("day"),
              date: lastDate ? addDays(lastDate, 1) : trip.startDate,
              title: null,
              stay: null,
              items: [],
            }),
          )
        }
      >
        Add day
      </AddButton>
    </section>
  );
}
