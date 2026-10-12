import { produce } from "immer";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, useAdminApi } from "@/app/lib/api";
import { type Trip, toSavePayload, validateTrip, withItemDone } from "@/app/lib/trips";

export type SaveStatus =
  | { state: "idle" | "pending" | "saving" | "saved" }
  | { state: "error" | "invalid"; message: string }
  | { state: "conflict" };

const SAVE_DELAY_MS = 800;

function message(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

/**
 * Loads a trip and keeps it in sync with the backend.
 * - update(recipe): edit the trip (immer draft); auto-saves the whole trip after a pause.
 * - toggleItem: checkbox tick, saved right away with the small PATCH endpoint.
 * All requests run one at a time, each with the latest version, so this tab never
 * conflicts with itself; a 409 means another device saved first.
 */
export function useTripSync(id: string) {
  const api = useAdminApi();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState<SaveStatus>({ state: "idle" });

  const tripRef = useRef<Trip | null>(null);
  const versionRef = useRef(0);
  const dirtyRef = useRef(false);
  const conflictRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const path = `/trips/${encodeURIComponent(id)}`;

  const show = useCallback((next: Trip) => {
    tripRef.current = next;
    setTrip(next);
  }, []);

  const enqueue = useCallback((task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(task).catch(() => {});
    return queueRef.current;
  }, []);

  const load = useCallback(async () => {
    const loaded = await api<Trip>(path);
    versionRef.current = loaded.version;
    dirtyRef.current = false;
    conflictRef.current = false;
    show(loaded);
    setStatus({ state: "idle" });
  }, [api, path, show]);

  useEffect(() => {
    load().catch((err) => setLoadError(message(err)));
  }, [load]);

  const flush = useCallback(() => {
    clearTimeout(timerRef.current);
    return enqueue(async () => {
      const current = tripRef.current;
      if (!dirtyRef.current || !current || conflictRef.current) {
        setStatus((prev) => (prev.state === "error" ? { state: "idle" } : prev));
        return;
      }
      const problem = validateTrip(current);
      if (problem) {
        setStatus({ state: "invalid", message: problem }); // stays dirty; saves once fixed
        return;
      }
      dirtyRef.current = false;
      setStatus({ state: "saving" });
      try {
        const saved = await api<Trip>(path, {
          method: "PUT",
          body: JSON.stringify(toSavePayload(current, versionRef.current)),
        });
        versionRef.current = saved.version;
        setStatus({ state: dirtyRef.current ? "pending" : "saved" });
      } catch (err) {
        dirtyRef.current = true;
        if (err instanceof ApiError && err.status === 409) {
          conflictRef.current = true;
          setStatus({ state: "conflict" });
        } else {
          setStatus({ state: "error", message: message(err) });
        }
      }
    });
  }, [api, enqueue, path]);

  const update = useCallback(
    (recipe: (draft: Trip) => void) => {
      const current = tripRef.current;
      if (!current) return;
      const next = produce(current, recipe);
      if (next === current) return;
      show(next);
      dirtyRef.current = true;
      if (conflictRef.current) return;
      setStatus({ state: "pending" });
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush, show],
  );

  const toggleItem = useCallback(
    (itemId: string, done: boolean) => {
      if (tripRef.current) show(withItemDone(tripRef.current, itemId, done));
      enqueue(async () => {
        try {
          const res = await api<{ version: number }>(`${path}/items/${encodeURIComponent(itemId)}`, {
            method: "PATCH",
            body: JSON.stringify({ done }),
          });
          versionRef.current = res.version;
        } catch (err) {
          if (tripRef.current) show(withItemDone(tripRef.current, itemId, !done));
          setStatus({ state: "error", message: `Checkmark not saved: ${message(err)}` });
        }
      });
    },
    [api, enqueue, path, show],
  );

  /** After a conflict: drop local edits and load what's on the server. */
  const reload = useCallback(() => enqueue(() => load().catch((err) => setLoadError(message(err)))), [enqueue, load]);

  /** After a conflict: save local edits over the newer server copy. */
  const overwrite = useCallback(async () => {
    await enqueue(async () => {
      const latest = await api<Trip>(path);
      versionRef.current = latest.version;
      conflictRef.current = false;
      dirtyRef.current = true;
    });
    return flush();
  }, [api, enqueue, flush, path]);

  // Warn before closing the tab with unsaved edits; save them when leaving the page in-app.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (dirtyRef.current) flush();
    };
  }, [flush]);

  return { trip, loadError, status, update, toggleItem, flush, reload, overwrite };
}
