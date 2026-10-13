import {
  type BudgetLine,
  type Leg,
  type Trip,
  LEG_STYLES,
  dayItems,
  daysUntil,
  formatMoneyRange,
  formatRange,
} from "@/app/lib/trips";
import { Checkbox, DayCard } from "./DayCard";
import { Md } from "./Md";
import { Progress } from "./Progress";
import { Reservations } from "./Reservations";

type Toggle = (itemId: string, done: boolean) => void;

const sectionTitle = "border-b-2 border-trip-sand pb-2 text-[1.4rem] font-semibold";

function countdown(trip: Trip): string | null {
  const untilStart = daysUntil(trip.startDate);
  const untilEnd = daysUntil(trip.endDate);
  if (untilStart > 1) return `Leaving in ${untilStart} days`;
  if (untilStart === 1) return "Leaving tomorrow";
  if (untilEnd >= 0) return `Day ${1 - untilStart} of ${1 - untilStart + untilEnd}`;
  return null;
}

function PhotoStrip({ photos, height = "h-32" }: { photos: Leg["photos"]; height?: string }) {
  if (photos.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2.5">
      {photos.map((photo) => (
        <figure key={photo.url} className="m-0 min-w-0 flex-1 basis-[140px]">
          <img
            src={photo.url}
            alt={photo.caption ?? ""}
            loading="lazy"
            className={`block w-full rounded-lg object-cover ${height}`}
          />
          {photo.caption && <figcaption className="mt-1 text-center text-xs text-[#8a7c6d]">{photo.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

function LegSection({ leg, onToggle }: { leg: Leg; onToggle: Toggle }) {
  const style = LEG_STYLES[leg.color];
  return (
    <section id={leg.id} className="scroll-mt-24">
      <h2 className={`flex items-center gap-2.5 ${sectionTitle}`}>
        <span className={`h-3 w-3 shrink-0 rounded-full ${style.dot}`} aria-hidden />
        {leg.name}
      </h2>
      {leg.subtitle && (
        <p className="mt-1.5 text-sm text-[#8a7c6d]">
          <Md inline>{leg.subtitle}</Md>
        </p>
      )}
      {leg.actions.map((action, i) => (
        <div key={i} className="mt-3 rounded-lg border border-[#f1c9a8] bg-[#fff4ec] px-4 py-3 text-sm">
          <strong className="text-[#a8501c]">Action needed:</strong> <Md inline>{action}</Md>
        </div>
      ))}
      <PhotoStrip photos={leg.photos} />
      {leg.dontMiss.length > 0 && (
        <div className="mt-3 rounded-lg border border-[#dbe8cc] bg-[#f3f7ee] px-4 py-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5a7a3f]">Don&apos;t miss — {leg.name}</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {leg.dontMiss.map((spot) => (
              <li key={spot.name}>
                <b>
                  <Md inline>{spot.name}</Md>
                </b>
                {spot.text && (
                  <>
                    {" — "}
                    <Md inline>{spot.text}</Md>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {leg.compareLinks.length > 0 && (
        <p className="mt-2 text-xs text-stone-500">
          Compare stays:{" "}
          {leg.compareLinks.map((link, i) => (
            <span key={link.url}>
              {i > 0 && " · "}
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-trip-ocean hover:underline">
                {link.label}
              </a>
            </span>
          ))}
        </p>
      )}
      <div className="mt-3.5 space-y-3.5">
        {leg.days.map((day) => (
          <DayCard key={day.id} day={day} color={leg.color} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

function Budget({ lines, travelers }: { lines: BudgetLine[]; travelers: number }) {
  if (lines.length === 0) return null;
  const low = lines.reduce((sum, l) => sum + (l.low ?? l.high ?? 0), 0);
  const high = lines.reduce((sum, l) => sum + (l.high ?? l.low ?? 0), 0);
  return (
    <section id="budget" className="scroll-mt-24">
      <h2 className={sectionTitle}>
        Budget <span className="text-base font-normal text-stone-500">(USD per person)</span>
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#f3ece0] text-left">
              <th className="px-2.5 py-2">Category</th>
              <th className="hidden px-2.5 py-2 sm:table-cell">Basis</th>
              <th className="whitespace-nowrap px-2.5 py-2 text-right">Per person</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-[#ece2d2]">
                <td className="px-2.5 py-2">{line.category}</td>
                <td className="hidden px-2.5 py-2 text-stone-500 sm:table-cell">{line.basis}</td>
                <td className="whitespace-nowrap px-2.5 py-2 text-right">{formatMoneyRange(line.low, line.high)}</td>
              </tr>
            ))}
            <tr className="bg-[#f9f2e3] font-bold">
              <td className="px-2.5 py-2" colSpan={1}>
                Total per person
              </td>
              <td className="hidden sm:table-cell" />
              <td className="whitespace-nowrap px-2.5 py-2 text-right">{formatMoneyRange(low, high)}</td>
            </tr>
            {travelers > 1 && (
              <tr className="bg-[#f9f2e3] font-bold">
                <td className="px-2.5 py-2">For all {travelers}</td>
                <td className="hidden sm:table-cell" />
                <td className="whitespace-nowrap px-2.5 py-2 text-right">
                  {formatMoneyRange(low * travelers, high * travelers)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TripView({ trip, onToggle }: { trip: Trip; onToggle: Toggle }) {
  const items = dayItems(trip);
  const when = countdown(trip);
  const sections = [
    ...trip.legs.map((leg) => ({ href: `#${leg.id}`, label: leg.name, dot: LEG_STYLES[leg.color].dot })),
    ...(trip.ideas.length ? [{ href: "#ideas", label: "Ideas", dot: "" }] : []),
    ...(trip.reservations.length ? [{ href: "#reservations", label: "Reservations", dot: "" }] : []),
    ...(trip.budget.length ? [{ href: "#budget", label: "Budget", dot: "" }] : []),
    ...(trip.notes.length ? [{ href: "#notes", label: "Notes", dot: "" }] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 text-trip-ink">
      <div className="space-y-4">
        <header className="rounded-xl bg-gradient-to-b from-trip-sky to-trip-paper px-5 pb-5 pt-7 text-center sm:px-8">
          {trip.variantLabel && (
            <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#6b5f55]">
              {trip.variantLabel}
            </span>
          )}
          <h1 className="mt-2 text-2xl font-bold sm:text-[1.7rem]">{trip.title}</h1>
          <p className="mt-1.5 text-sm text-[#6b5f55]">
            {trip.subtitle ||
              `${formatRange(trip.startDate, trip.endDate)}${trip.origin ? ` · Departing ${trip.origin}` : ""}`}
          </p>
          {when && <p className="mt-2 text-sm font-semibold text-trip-teal">{when}</p>}
          <PhotoStrip photos={trip.heroPhotos} height="h-28 sm:h-36" />
          <Progress done={items.filter((i) => i.done).length} total={items.length} className="mx-auto mt-4 max-w-sm text-left" />
        </header>

        <nav aria-label="Trip sections" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2 py-1 sm:w-auto sm:flex-wrap">
            {sections.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#ece2d2] bg-white px-3 py-1 text-sm hover:border-stone-400"
              >
                {s.dot && <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />}
                {s.label}
              </a>
            ))}
          </div>
        </nav>
      </div>

      {trip.intro && (
        <section className="rounded-lg border border-[#ece2d2] bg-white px-5 py-4">
          <Md>{trip.intro}</Md>
        </section>
      )}

      {trip.legs.map((leg) => (
        <LegSection key={leg.id} leg={leg} onToggle={onToggle} />
      ))}

      {trip.ideas.length > 0 && (
        <section id="ideas" className="scroll-mt-24">
          <h2 className={sectionTitle}>Ideas to swap in</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {trip.ideas.map((idea) => (
              <li key={idea.id} className="flex items-start gap-2">
                <Checkbox item={idea} accent="accent-trip-torii" onToggle={onToggle} />
                <span className={idea.done ? "text-stone-400 line-through" : ""}>
                  <b>
                    <Md inline>{idea.title}</Md>
                  </b>
                  {idea.description && (
                    <>
                      {" — "}
                      <Md inline>{idea.description}</Md>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Reservations reservations={trip.reservations} legs={trip.legs} />

      <Budget lines={trip.budget} travelers={trip.travelers} />

      {trip.notes.length > 0 && (
        <section id="notes" className="scroll-mt-24">
          <h2 className={sectionTitle}>Notes</h2>
          <ul className="mt-3 space-y-3">
            {trip.notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-[#ecdcb8] bg-[#fbf3e3] px-4 py-3 text-sm">
                {note.title && <p className="font-semibold">{note.title}</p>}
                <Md>{note.body}</Md>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
