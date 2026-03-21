/**
 * Safely format a date string for display.
 * Returns formatted date or null if invalid.
 */
export function formatDate(value: string | undefined | null): string | null {
  if (value == null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Get YYYY-MM-DD from ISO string for date input value */
export function toDateInputValue(value: string | undefined | null): string {
  if (value == null || value === "") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Convert YYYY-MM-DD from date input to ISO string for API */
export function fromDateInputToISO(value: string | undefined | null): string | undefined {
  if (value == null || value === "") return undefined;
  const date = new Date(value + "T00:00:00.000Z");
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
