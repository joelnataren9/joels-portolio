import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type Fold = (sectionId: string, collapsed: boolean) => void;

export const sectionTitle = "border-b-2 border-trip-sand pb-2 text-[1.4rem] font-semibold";

/** A trip section whose heading folds it shut. The fold is saved with the trip, so it stays shut. */
export function FoldSection({
  id,
  title,
  meta,
  collapsed,
  onFold,
  children,
}: {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  collapsed: boolean;
  onFold: Fold;
  children: ReactNode;
}) {
  const bodyId = `${id}-body`;
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className={sectionTitle}>
        <button
          type="button"
          onClick={() => onFold(id, !collapsed)}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          title={collapsed ? "Show section" : "Hide section"}
          className="group flex w-full items-center gap-2.5 text-left"
        >
          <span className="flex min-w-0 flex-1 items-center gap-2.5">{title}</span>
          {meta && <span className="shrink-0 text-sm font-normal text-stone-500">{meta}</span>}
          <ChevronDown
            aria-hidden
            className={`h-5 w-5 shrink-0 text-stone-400 transition-transform group-hover:text-stone-700 ${
              collapsed ? "-rotate-90" : ""
            }`}
          />
        </button>
      </h2>
      <div id={bodyId} hidden={collapsed}>
        {children}
      </div>
    </section>
  );
}
