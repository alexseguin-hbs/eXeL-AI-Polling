/** Format date as YYYY.MM.DD — consistent across all ARX displays.
 *  Adds T12:00:00 to date-only strings to prevent timezone day-shift. */
export function fmtDate(d: string): string {
  const dt = new Date(d + (d.length === 10 ? "T12:00:00" : ""));
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
