// ARCHITECT-2525 / FUTURE · public contract surface (plan §22). Re-exports ONLY architect-future modules —
// never a legacy module (the T-IMPORT-BAN boundary). The domain types here are the locked V2 schema (SCHEMA_LOCK).
export * from "./domain/evidence";
export * from "./domain/actors";
export * from "./domain/geometry";
export * from "./domain/walls";
export * from "./domain/openings";
export * from "./domain/assets";
export * from "./domain/construction";
export * from "./domain/economics";
export * from "./domain/ratings";
export * from "./domain/intent";
export * from "./domain/project";
export * from "./rcore/events";
