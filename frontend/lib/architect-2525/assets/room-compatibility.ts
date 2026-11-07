/**
 * ARCHITECT-2525 · ROOM COMPATIBILITY (Rev A, brief §4) — assets discoverable BY ROOM and under GENERAL.
 * =================================================================================================
 * The nine canonical rooms are room-layout's TINY_ROOM_LAYOUT keys (M Master Bedroom · B Master Bath · C Master Closet
 * · L Living · K Kitchen · D Dining · O Office · S Storage·Laundry · E Entry·Porch) — never a tenth. A shared asset
 * (door, window, shell, roof …) is "GENERAL": ONE definition referenced by every room, never seven copies. The room
 * palette the designer shows today (ROOM_ASSETS + COMMON_ASSETS, room-objects) is a curated SUBSET of this
 * compatibility (gated ⊆) — this is the wider "what may go here" truth the Asset Library filters on.
 * Pure, no React.
 */
import { ASSET_PARAMS, OBJECT_KINDS, ROOM_KEYS, type ObjectKind, type RoomKey } from "@/lib/room-objects";

/** The rooms a kind is compatible with, or "GENERAL" for a shared asset. */
export function roomsOf(kind: ObjectKind): RoomKey[] | "GENERAL" { return ASSET_PARAMS[kind].rooms; }

/** Is a kind compatible with a room? A GENERAL asset is compatible with every room. */
export function isCompatibleWithRoom(kind: ObjectKind, room: RoomKey): boolean {
  const r = ASSET_PARAMS[kind].rooms;
  return r === "GENERAL" || r.includes(room);
}

/** The shared assets — compatible with every room without duplicating their definition. */
export function assetsGeneral(): ObjectKind[] { return OBJECT_KINDS.filter((k) => ASSET_PARAMS[k].rooms === "GENERAL"); }

/** The assets compatible with a room — its own plus (by default) the GENERAL set; OBJECT_KINDS order, deterministic. */
export function assetsForRoom(room: RoomKey, includeGeneral = true): ObjectKind[] {
  return OBJECT_KINDS.filter((k) => {
    const r = ASSET_PARAMS[k].rooms;
    return r === "GENERAL" ? includeGeneral : r.includes(room);
  });
}

/** His room taxonomy (intake master §13) ⇄ the legacy one-letter keys — one map, both directions. */
export type RoomName = "MASTER_BEDROOM" | "MASTER_BATH" | "MASTER_CLOSET" | "LIVING" | "KITCHEN" | "DINING" | "OFFICE" | "STORAGE_LAUNDRY" | "ENTRY_PORCH";
export const ROOM_NAME_BY_KEY: Record<RoomKey, RoomName> = {
  M: "MASTER_BEDROOM", B: "MASTER_BATH", C: "MASTER_CLOSET", L: "LIVING", K: "KITCHEN", D: "DINING", O: "OFFICE", S: "STORAGE_LAUNDRY", E: "ENTRY_PORCH",
};
export const ROOM_NAMES: readonly RoomName[] = ROOM_KEYS.map((k) => ROOM_NAME_BY_KEY[k]);
export function roomKeyByName(name: string): RoomKey | undefined { return ROOM_KEYS.find((k) => ROOM_NAME_BY_KEY[k] === name); }
/** A kind's rooms in his vocabulary — ["GENERAL"] for a shared asset (his metadata `rooms`). */
export function roomNamesOf(kind: ObjectKind): string[] {
  const r = ASSET_PARAMS[kind].rooms;
  return r === "GENERAL" ? ["GENERAL"] : r.map((k) => ROOM_NAME_BY_KEY[k]);
}

/** Is this one of the nine canonical room keys? */
export function isRoomKey(k: string): k is RoomKey { return (ROOM_KEYS as readonly string[]).includes(k); }
