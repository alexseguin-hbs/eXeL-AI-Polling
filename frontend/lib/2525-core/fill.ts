// ONE PLACEHOLDER FILLER. `t()` returns a template; the arguments are named {a} {b} {c}. Pure: a missing
// argument leaves its placeholder visible rather than vanishing, so an untranslated hole is seen, not hidden.
export type FillArgs = Readonly<Record<string, string | number | undefined>>;
export const fill = (template: string, args: FillArgs = {}): string =>
  template.replace(/\{([a-z_]+)\}/g, (m, k: string) => (args[k] === undefined || args[k] === null ? m : String(args[k])));
