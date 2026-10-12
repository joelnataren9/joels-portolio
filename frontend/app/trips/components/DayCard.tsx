import { type Day, type Item, type LegColor, LEG_STYLES, formatDay, todayISO } from "@/app/lib/trips";
import { Md, plainText } from "./Md";

type Toggle = (itemId: string, done: boolean) => void;

export function Checkbox({ item, accent, onToggle }: { item: Item; accent: string; onToggle: Toggle }) {
  return (
    <input
      type="checkbox"
      checked={item.done}
      onChange={(e) => onToggle(item.id, e.target.checked)}
      aria-label={`Done: ${plainText(item.title)}`}
      className={`mt-[3px] h-4 w-4 shrink-0 cursor-pointer ${accent}`}
    />
  );
}

export function Tag({ children }: { children: string }) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-trip-sand px-2 py-px text-[0.7rem] font-bold text-[#6b4a2b]">
      {children}
    </span>
  );
}

function ItemRow({ item, accent, onToggle }: { item: Item; accent: string; onToggle: Toggle }) {
  const doneText = item.done ? "text-stone-400 line-through decoration-stone-300" : "";
  const title = (
    <>
      {item.optional && <em className="mr-1 font-normal text-stone-500">Optional:</em>}
      <Md inline>{item.title}</Md>
    </>
  );

  // Place · tag · description layout (the "row" items in the itinerary pages).
  if (item.description) {
    return (
      <li className="grid grid-cols-[18px_1fr] gap-x-3 gap-y-1 border-b border-dashed border-[#efe6d6] py-2 last:border-b-0 sm:grid-cols-[18px_minmax(150px,32%)_150px_1fr]">
        <Checkbox item={item} accent={accent} onToggle={onToggle} />
        <span className={`font-semibold text-[#3d332b] ${doneText}`}>{title}</span>
        <span className="col-start-2 sm:col-start-auto">{item.tag && <Tag>{item.tag}</Tag>}</span>
        <span className="col-start-2 text-[0.86rem] leading-snug text-[#6b5f55] sm:col-start-auto">
          <Md inline>{item.description}</Md>
        </span>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2 py-1 text-[0.94rem]">
      <Checkbox item={item} accent={accent} onToggle={onToggle} />
      <span className={doneText}>
        {title}
        {item.tag && (
          <>
            {" "}
            <Tag>{item.tag}</Tag>
          </>
        )}
      </span>
    </li>
  );
}

export function DayCard({ day, color, onToggle }: { day: Day; color: LegColor; onToggle: Toggle }) {
  const style = LEG_STYLES[color];
  const done = day.items.filter((i) => i.done).length;
  const isToday = day.date === todayISO();

  return (
    <article
      id={day.id}
      className={`scroll-mt-24 rounded-lg border border-l-4 border-[#ece2d2] ${style.border} bg-white px-4 py-3.5 sm:px-5 ${
        isToday ? "ring-2 ring-trip-gold/70" : ""
      }`}
    >
      <header className="mb-1 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <p className="text-[0.95rem] font-bold">
            {formatDay(day.date)}
            {day.title && ` — ${day.title}`}
            {isToday && (
              <span className="ml-2 rounded-full bg-trip-gold px-2 py-0.5 align-middle text-xs font-semibold text-white">
                Today
              </span>
            )}
          </p>
          {day.items.length > 0 && (
            <p className="text-xs text-stone-500">
              {done}/{day.items.length} done
            </p>
          )}
        </div>
        {day.stay && (
          <div className="max-w-full break-words rounded-md bg-[#f6ead2] px-2.5 py-1 text-xs leading-snug sm:max-w-[55%] sm:text-right text-[#6b5f55] [&_strong]:text-[#4a3f34]">
            <Md inline>{day.stay}</Md>
          </div>
        )}
      </header>
      <ul className="mt-1.5">
        {day.items.map((item) => (
          <ItemRow key={item.id} item={item} accent={style.accent} onToggle={onToggle} />
        ))}
      </ul>
    </article>
  );
}
