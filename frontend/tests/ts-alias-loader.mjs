// Resolve hook for node --experimental-strip-types tests: maps the "@/..." path alias to the
// frontend root and appends .ts/.tsx to extensionless relative imports (superset of ts-ext-loader).
import { pathToFileURL } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = pathResolve(dirname(fileURLToPath(import.meta.url)), ".."); // frontend/

export async function resolve(spec, ctx, next) {
  // "@/lib/x" → "<frontend>/lib/x"
  if (spec.startsWith("@/")) {
    const base = pathToFileURL(pathResolve(ROOT, spec.slice(2))).href;
    for (const cand of [base, base + ".ts", base + ".tsx"]) {
      try { return await next(cand, ctx); } catch { /* try next */ }
    }
  }
  try { return await next(spec, ctx); }
  catch (e) {
    if (/^\.{1,2}\//.test(spec) && !/\.[a-z0-9]+$/i.test(spec)) {
      try { return await next(spec + ".ts", ctx); } catch { return await next(spec + ".tsx", ctx); }
    }
    throw e;
  }
}
