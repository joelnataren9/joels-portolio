"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useAdminApi } from "@/app/lib/api";
import { type Trip, toSavePayload } from "@/app/lib/trips";
import { TripView } from "../components/TripView";
import { SaveBar } from "../components/edit/SaveBar";
import { TripEditor } from "../components/edit/TripEditor";
import { useTripSync } from "../useTripSync";

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const api = useAdminApi();
  const { trip, loadError, status, update, toggleItem, flush, reload, overwrite } = useTripSync(id);
  const [editing, setEditing] = useState(false);

  // New trips and duplicates open straight into edit mode (?edit=1).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("edit") === "1") setEditing(true);
  }, []);

  if (loadError) return <p className="text-sm text-red-600">{loadError}</p>;
  if (!trip) return <p className="text-sm text-stone-500">Loading trip…</p>;

  async function duplicate() {
    if (!trip) return;
    const label = window.prompt("Name for the new version (e.g. Reverse loop):", "");
    if (label === null) return;
    await flush();
    try {
      const { version: _version, ...fields } = toSavePayload(trip, 0);
      const created = await api<Trip>("/trips", {
        method: "POST",
        body: JSON.stringify({ ...fields, variantLabel: label || null, variantGroupId: trip.variantGroupId ?? trip.id }),
      });
      router.push(`/trips/${created.id}?edit=1`);
    } catch (err) {
      window.alert(`Couldn't duplicate: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function remove() {
    if (!trip || !window.confirm(`Delete "${trip.title}"? This can't be undone.`)) return;
    await flush();
    try {
      await api(`/trips/${encodeURIComponent(id)}`, { method: "DELETE" });
      router.replace("/trips");
    } catch (err) {
      window.alert(`Couldn't delete: ${err instanceof Error ? err.message : err}`);
    }
  }

  function finishEditing() {
    flush();
    setEditing(false);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <div className="mx-auto mb-4 flex w-full max-w-3xl items-center justify-between">
        <Link href="/trips" className="text-sm text-stone-500 hover:text-stone-800">
          ← All trips
        </Link>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#ece2d2] bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-400"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit trip
          </button>
        )}
      </div>
      {editing ? (
        <TripEditor trip={trip} update={update} onToggle={toggleItem} onDuplicate={duplicate} onDelete={remove} />
      ) : (
        <TripView trip={trip} onToggle={toggleItem} />
      )}
      <SaveBar
        status={status}
        editing={editing}
        onDone={finishEditing}
        onRetry={() => void flush()}
        onReload={() => void reload()}
        onOverwrite={() => void overwrite()}
      />
    </>
  );
}
