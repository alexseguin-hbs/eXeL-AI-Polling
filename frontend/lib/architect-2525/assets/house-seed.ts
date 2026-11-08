/**
 * ARCHITECT-2525 · HOUSE SEED (operator 2026-11-08: "you're suppose to pick typical items for a standard layout for each
 * room; ensure one can get into each room, and layout new assets").
 * =================================================================================================
 * The default house furnishes each room with its TYPICAL ITEMS in a STANDARD LAYOUT — NOT a dump of all 139. The prior
 * Phase-0 seed packed the whole library into rooms load-balanced; the operator corrected it: a room is a room, not a
 * warehouse. So the seed now defers to the app's ONE standard-layout source — `defaultObjectsForRoom` (room-objects.ts):
 * the hand-decided `STANDARD_LAYOUTS` where a room has one (the Master Bedroom's Layout A′), else the door-aware
 * occupancy packer over that room's typical `ROOM_ASSETS`. Those objects render as the real GLB library in the walk
 * (architect-walkthrough resolves a kind → its library id via ASSET_ID_BY_KIND), the entry door is kept clear (the packer
 * reserves the door lane; the walk's collide-and-slide also carves a door lane), and a user's saved objects always win.
 *
 * COVERAGE of all 139 now lives in the 3D Asset Lab (/Architect-2525/library) — browse/rotate every asset there; the
 * HOUSE is a believable standard home. This layer only sets RoomCell.objects (illustrative); it never touches canonical
 * truth (900 ft², the project hash, the R-CORE revision). Pure, deterministic (replay law). Leaf consumer of room-objects.
 */
import { defaultObjectsForRoom, type PlacedObject } from "@/lib/room-objects";

/** The seeded standard-layout objects for one room key (a fresh copy): its typical items, door kept clear. */
export function seededObjectsForRoom(roomKey: string): PlacedObject[] {
  return defaultObjectsForRoom(roomKey).map((o) => ({ ...o }));
}

/** Populate a room layout's `objects` with its standard layout (only rooms that have none yet — a user's saved objects
 *  win). Returns a new layout; never mutates. The renderers already read `room.objects ?? defaultObjectsForRoom`. */
export function seedHouseFromLibrary<T extends { k: string; objects?: PlacedObject[] }>(layout: T[]): T[] {
  return layout.map((r) => (r.objects && r.objects.length > 0 ? r : { ...r, objects: seededObjectsForRoom(r.k) }));
}
