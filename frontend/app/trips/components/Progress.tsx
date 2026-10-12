export function Progress({ done, total, className = "" }: { done: number; total: number; className?: string }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <div className={className}>
      <div className="flex justify-between text-xs text-stone-500">
        <span>
          {done} of {total} done
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-trip-teal transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
