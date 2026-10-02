/**
 * THE CHART'S EXPENSE MARKS — where each dot and its label go (moved out of components/2525-core/rcore-chart.tsx in Financial-2525 r.073 so
 * the rule is tested as behaviour, not read as source). Pure: no canvas, no React; the chart measures the label widths and draws.
 */
export interface MarkDot { x: number; y: number; text: string; w: number; value?: number; color: string }
export interface MarkLabel { x: number; y: number; dotX: number; dotY: number; text: string; color: string; align: "left" | "right" | "center"; base: "bottom" | "top" | "middle"; merged: number }
/** THE MARK LAYOUT (addendum 136), pure. Dots that overlap (their circles reach each other side to side — addendum 171) become ONE
 *  dot with one label (their values summed). Dots that are only close (their centred labels would collide) keep their own dots and
 *  their labels move around them: two → left of the first, right of the second; three → top-left, bottom-centre, top-right; four →
 *  top-left, bottom-left, bottom-right, top-right (a longer run is laid out four at a time). One alone sits centred above its dot. */
export function layoutMarks(dots: MarkDot[], r: number, sum?: (v: number) => string): MarkLabel[] {
  const sorted = [...dots].sort((a, b) => a.x - b.x);
  // 1 · merge the dots whose circles overlap side to side (Financial-2525 r.073, addendum 171 "if the expense circle overlaps (left or
  //     right edge overlaps with another expense, merge)"): the test is HORIZONTAL — a dot whose left edge reaches the right edge of the
  //     dot before it joins it, whatever their heights (two dots on different levels of a step line measured diagonally used to stay
  //     apart, −$2,700.66 beside −$155.44). A chain merges whole: a dot that touches the last dot of a group joins the group.
  const merged: (MarkDot & { n: number; xr: number })[] = [];
  for (const d of sorted) {
    const last = merged[merged.length - 1];
    if (last && d.x - last.xr <= 2 * r) {
      const n = last.n + 1, both = last.value !== undefined && d.value !== undefined && !!sum;
      const value = both ? (last.value as number) + (d.value as number) : undefined;
      merged[merged.length - 1] = { x: (last.x * last.n + d.x) / n, xr: d.x, y: Math.min(last.y, d.y), w: last.w, color: last.color, n, value,
        text: both ? (sum as (v: number) => string)(value as number) : `${last.text} ${d.text}` };
    } else merged.push({ ...d, n: 1, xr: d.x });
  }
  // 2 · runs of dots whose centred labels would touch
  const runs: (typeof merged)[] = [];
  for (const d of merged) {
    const run = runs[runs.length - 1], prev = run?.[run.length - 1];
    if (prev && d.x - prev.x < (prev.w + d.w) / 2 + 4 && run.length < 4) run.push(d); else runs.push([d]);
  }
  const g = r + 2;
  const at = (d: (typeof merged)[number], where: "top" | "left" | "right" | "tl" | "tr" | "bc" | "bl" | "br"): MarkLabel => {
    const base = { dotX: d.x, dotY: d.y, text: d.text, color: d.color, merged: d.n };
    switch (where) {
      case "left": return { ...base, x: d.x - g - 1, y: d.y, align: "right", base: "middle" };
      case "right": return { ...base, x: d.x + g + 1, y: d.y, align: "left", base: "middle" };
      case "tl": return { ...base, x: d.x - g, y: d.y - r, align: "right", base: "bottom" };
      case "tr": return { ...base, x: d.x + g, y: d.y - r, align: "left", base: "bottom" };
      case "bc": return { ...base, x: d.x, y: d.y + g, align: "center", base: "top" };
      case "bl": return { ...base, x: d.x - g, y: d.y + r, align: "right", base: "top" };
      case "br": return { ...base, x: d.x + g, y: d.y + r, align: "left", base: "top" };
      default: return { ...base, x: d.x, y: d.y - g - 1, align: "center", base: "bottom" };
    }
  };
  const SLOTS: Record<number, ("top" | "left" | "right" | "tl" | "tr" | "bc" | "bl" | "br")[]> = { 1: ["top"], 2: ["left", "right"], 3: ["tl", "bc", "tr"], 4: ["tl", "bl", "br", "tr"] };
  return runs.flatMap((run) => run.map((d, i) => at(d, SLOTS[run.length][i])));
}
