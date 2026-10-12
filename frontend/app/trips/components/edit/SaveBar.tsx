"use client";

import type { SaveStatus } from "../../useTripSync";

const TEXT: Record<string, string> = {
  idle: "All changes saved",
  saved: "All changes saved",
  pending: "Unsaved changes…",
  saving: "Saving…",
};

/** Fixed bar with save state; shown while editing, or whenever something needs attention. */
export function SaveBar({
  status,
  editing,
  onDone,
  onRetry,
  onReload,
  onOverwrite,
}: {
  status: SaveStatus;
  editing: boolean;
  onDone: () => void;
  onRetry: () => void;
  onReload: () => void;
  onOverwrite: () => void;
}) {
  const problem = status.state === "error" || status.state === "invalid" || status.state === "conflict";
  if (!editing && !problem) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ece2d2] bg-white/95 px-4 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 text-sm">
        <div role="status" aria-live="polite" className="min-w-0 flex-1">
          {status.state === "conflict" ? (
            <span className="text-orange-700">
              This trip was changed on another device.{" "}
              <button type="button" onClick={onReload} className="font-semibold underline">
                Load latest
              </button>{" "}
              (drops your edits here) or{" "}
              <button type="button" onClick={onOverwrite} className="font-semibold underline">
                keep mine
              </button>
              .
            </span>
          ) : status.state === "error" ? (
            <span className="text-red-600">
              Not saved: {status.message}{" "}
              <button type="button" onClick={onRetry} className="font-semibold underline">
                Retry
              </button>
            </span>
          ) : status.state === "invalid" ? (
            <span className="text-orange-700">Not saved yet: {status.message}</span>
          ) : (
            <span className={status.state === "pending" || status.state === "saving" ? "text-stone-500" : "text-trip-teal"}>
              {TEXT[status.state]}
            </span>
          )}
        </div>
        {editing && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-trip-teal px-4 py-1.5 font-medium text-white hover:bg-trip-teal/90"
          >
            Done editing
          </button>
        )}
      </div>
    </div>
  );
}
