// Pure helpers for the theme detail sheet + compact description list (t181, 2026-11-09). Unit-locked in
// tests/theme-detail.test.mjs.
import type { ThemeInfo } from "@/lib/types";

/** Target description length per Theme Level dial position: 111 words at 9, 222 at 6, 333 at 3. */
export const DESCRIPTION_WORDS: Record<3 | 6 | 9, number> = { 9: 111, 6: 222, 3: 333 };

export type DescriptionState = "hidden" | "locked" | "text" | "unavailable";

/** What the description block shows: hidden until the API sends the field; locked (payment prompt, never the
 *  text) for an unpaid viewer; the text when paid; "unavailable" when sent but empty/withheld. */
export function descriptionState(theme: Pick<ThemeInfo, "description">, isPaid: boolean): DescriptionState {
  if (theme.description === undefined) return "hidden";
  if (!isPaid) return "locked";
  return theme.description && theme.description.trim() ? "text" : "unavailable";
}

/** The first line (sentence, or first ~140 chars) of a description, for the compact list. */
export function firstLine(text: string | null | undefined, max = 140): string {
  const s = (text ?? "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  const m = s.match(/^(.+?[.!?])(\s|$)/);
  const line = m && m[1].length <= max ? m[1] : s;
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

export function wordCount(text: string | null | undefined): number {
  const s = (text ?? "").trim();
  return s ? s.split(/\s+/).length : 0;
}
