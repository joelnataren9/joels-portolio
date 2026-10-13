"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import {
  IDEAS,
  type Item,
  type Trip,
  containerOf,
  findItem,
  formatDay,
  isContainer,
  itemList,
  moveItem,
  newItem,
} from "@/app/lib/trips";
import { plainText } from "../Md";
import { AddButton, IconButton, MARKDOWN_HINT, Select, TextArea, TextInput, orNull } from "./fields";

export type Update = (recipe: (draft: Trip) => void) => void;
export type Toggle = (itemId: string, done: boolean) => void;
type MoveOption = { group: string; options: { id: string; label: string }[] };

/** "Move to" choices: every day grouped by leg, plus the ideas list. */
export function moveOptions(trip: Trip): MoveOption[] {
  return [
    ...trip.legs.map((leg) => ({
      group: leg.name || "Untitled leg",
      options: leg.days.map((day) => ({
        id: day.id,
        label: `${day.date ? formatDay(day.date) : "No date"}${day.title ? ` — ${day.title}` : ""}`,
      })),
    })),
    { group: "Unscheduled", options: [{ id: IDEAS, label: "Ideas to swap in" }] },
  ];
}

/** Drag-and-drop for items across all days and the ideas list. */
export function ItemsDnd({ trip, update, children }: { trip: Trip; update: Update; children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const targetContainer = (draft: Trip, overId: string) =>
    isContainer(draft, overId) ? overId : containerOf(draft, overId);

  // Crossing into another list moves the item right away so the gap opens there.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    update((draft) => {
      const from = containerOf(draft, activeId);
      const to = targetContainer(draft, overId);
      if (!from || !to || from === to) return;
      const target = itemList(draft, to)!;
      const overIndex = target.findIndex((i) => i.id === overId);
      moveItem(draft, activeId, to, overIndex >= 0 ? overIndex : target.length);
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    update((draft) => {
      const container = containerOf(draft, activeId);
      if (!container || container !== targetContainer(draft, overId)) return;
      const list = itemList(draft, container)!;
      const from = list.findIndex((i) => i.id === activeId);
      const to = list.findIndex((i) => i.id === overId);
      if (to >= 0 && from !== to) list.splice(to, 0, list.splice(from, 1)[0]);
    });
  }

  const active = activeId ? findItem(trip, activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {children}
      <DragOverlay>
        {active ? (
          <div className="rounded-md border border-trip-teal bg-white px-3 py-2 text-sm shadow-lg">
            {plainText(active.title) || "New item"}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function ItemEditor({
  item,
  containerId,
  accent,
  options,
  update,
  onToggle,
}: {
  item: Item;
  containerId: string;
  accent: string;
  options: MoveOption[];
  update: Update;
  onToggle: Toggle;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const edit = (recipe: (it: Item) => void) =>
    update((draft) => {
      const target = findItem(draft, item.id);
      if (target) recipe(target);
    });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-md border border-[#ece2d2] bg-white p-2 ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag to move: ${plainText(item.title) || "new item"}`}
          className="mt-1 cursor-grab touch-none rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <input
          type="checkbox"
          checked={item.done}
          onChange={(e) => onToggle(item.id, e.target.checked)}
          aria-label="Done"
          className={`mt-2 h-4 w-4 shrink-0 cursor-pointer ${accent}`}
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <TextArea
            value={item.title}
            autoFocus={item.title === ""}
            placeholder={`What to do. ${MARKDOWN_HINT}`}
            onChange={(e) => edit((it) => void (it.title = e.target.value))}
            className="font-medium"
            aria-label="Item"
          />
          <div className="grid gap-1.5 sm:grid-cols-[150px_1fr]">
            <TextInput
              value={item.tag ?? ""}
              placeholder="Tag (e.g. Temple)"
              onChange={(e) => edit((it) => void (it.tag = orNull(e.target.value)))}
              aria-label="Tag"
            />
            <TextArea
              value={item.description ?? ""}
              placeholder="Description (optional)"
              onChange={(e) => edit((it) => void (it.description = orNull(e.target.value)))}
              aria-label="Description"
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={item.optional}
                onChange={(e) => edit((it) => void (it.optional = e.target.checked))}
              />
              Optional
            </label>
            <label className="flex min-w-0 items-center gap-1.5">
              Move to
              <Select
                value={containerId}
                onChange={(e) => update((draft) => moveItem(draft, item.id, e.target.value))}
                className="w-auto max-w-[220px] py-0.5 text-xs"
              >
                {options.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </label>
          </div>
        </div>
        <IconButton
          label="Delete item"
          danger
          onClick={() =>
            update((draft) => {
              const list = itemList(draft, containerId);
              if (list) list.splice(list.findIndex((i) => i.id === item.id), 1);
            })
          }
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </li>
  );
}

/** A sortable, droppable list of items for one day (or the ideas list). */
export function ItemList({
  containerId,
  items,
  accent,
  options,
  update,
  onToggle,
  addLabel = "Add item",
}: {
  containerId: string;
  items: Item[];
  accent: string;
  options: MoveOption[];
  update: Update;
  onToggle: Toggle;
  addLabel?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: containerId });
  return (
    <div className="space-y-2">
      <SortableContext id={containerId} items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={`min-h-[44px] space-y-2 rounded-md p-1 transition ${isOver ? "bg-trip-sky/40" : ""} ${
            items.length === 0 ? "border border-dashed border-stone-300" : ""
          }`}
        >
          {items.length === 0 && <li className="px-2 py-2.5 text-xs text-stone-400">Drop items here</li>}
          {items.map((item) => (
            <ItemEditor
              key={item.id}
              item={item}
              containerId={containerId}
              accent={accent}
              options={options}
              update={update}
              onToggle={onToggle}
            />
          ))}
        </ul>
      </SortableContext>
      <AddButton onClick={() => update((draft) => void itemList(draft, containerId)?.push(newItem()))}>{addLabel}</AddButton>
    </div>
  );
}
