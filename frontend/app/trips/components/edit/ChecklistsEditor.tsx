"use client";

import { LEG_STYLES, type Trip, moveInArray, newId } from "@/app/lib/trips";
import { AddButton, Field, RowActions, TextInput } from "./fields";
import { ItemList, type Toggle, type Update, moveOptions } from "./ItemEditors";

/** Free-standing checklists such as "Things to pack". Must sit inside ItemsDnd. */
export function ChecklistsEditor({ trip, update, onToggle }: { trip: Trip; update: Update; onToggle: Toggle }) {
  const lists = trip.checklists;
  const options = moveOptions(trip);
  return (
    <section id="lists" className="scroll-mt-24 space-y-3">
      <h2 className="border-b-2 border-trip-sand pb-2 text-[1.4rem] font-semibold">Lists</h2>
      <p className="text-sm text-stone-500">
        Checklists that aren&apos;t tied to a day, like things to pack. In the trip view, click any section&apos;s
        heading to fold it away. It stays folded until someone opens it again.
      </p>
      {lists.map((list, i) => (
        <div key={list.id} className="space-y-2 rounded-lg border border-[#ece2d2] bg-[#fdfaf5] p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <Field label="List name" className="flex-1">
              <TextInput
                value={list.title}
                autoFocus={list.title === ""}
                placeholder="e.g. Things to pack"
                onChange={(e) => update((d) => void (d.checklists[i].title = e.target.value))}
                className="font-semibold"
              />
            </Field>
            <RowActions
              what="list"
              onUp={i > 0 ? () => update((d) => moveInArray(d.checklists, i, i - 1)) : undefined}
              onDown={i < lists.length - 1 ? () => update((d) => moveInArray(d.checklists, i, i + 1)) : undefined}
              onDelete={() => {
                if (list.items.length === 0 || confirm(`Delete "${list.title || "untitled list"}" and its ${list.items.length} items?`)) {
                  update((d) => void d.checklists.splice(i, 1));
                }
              }}
            />
          </div>
          <ItemList
            containerId={list.id}
            items={list.items}
            accent={LEG_STYLES.teal.accent}
            options={options}
            update={update}
            onToggle={onToggle}
            compact
          />
        </div>
      ))}
      <AddButton onClick={() => update((d) => void d.checklists.push({ id: newId("list"), title: "", items: [] }))}>
        Add list
      </AddButton>
    </section>
  );
}
