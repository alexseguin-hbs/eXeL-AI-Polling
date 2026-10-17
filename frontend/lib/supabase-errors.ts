/**
 * Shared PostgREST error classifiers.
 *
 * Two owner-scoped stores need the same two questions answered — "is the RPC absent, so fall back to the
 * legacy direct-table path?" and "is the table absent, so this is local-only rather than a real error?" —
 * and until now each carried its own copy. A classifier that drifts between two stores is a store that
 * degrades differently from its twin for the same server response, which is exactly the kind of difference
 * nobody notices until one of them is silently writing nothing.
 *
 * `innovation-store.ts` keeps its own copies for now: its gate pins text by offset inside that file
 * (tests/innovation-store-security.test.mjs:231-233 slices on `src.indexOf("function randomId")`), so moving
 * code out of it is its own change. Folding it in is OWED and named here rather than left implicit.
 */
export const errText = (e: unknown): string =>
  `${(e as { code?: string } | null)?.code ?? ""} ${(e as { message?: string } | null)?.message ?? ""}`.toLowerCase();

/** The hardened RPCs are absent (pre-migration) → use the legacy direct-table path. */
export const isMissingFn = (e: unknown): boolean =>
  /pgrst202|42883|could not find the function|function .* does not exist/.test(errText(e));

/** A missing table is expected before its migration → report local-only, not an error the user must act on. */
export const isMissingTable = (e: unknown): boolean =>
  /42p01|pgrst205|does not exist|could not find|schema cache/.test(errText(e));
