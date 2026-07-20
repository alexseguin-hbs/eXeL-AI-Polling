/**
 * ARCHITECT-2525 · shared per-object-kind lucide icons — ONE source so the room-designer palette / 2D / 3D AND the
 * Vision Tree furniture section show the SAME mini icon for each kind (operator: the tree's furniture section must
 * match the room's mini icons). No emojis (project rule) — our own iconology.
 */
import {
  Bed, Sofa, CookingPot, Utensils, Monitor, Toilet, Bath, Droplet, WashingMachine, DoorOpen,
  RectangleHorizontal, Archive, Lamp, Tv, Refrigerator, Flame, ShowerHead, DoorClosed, Library, Armchair,
  Hexagon, Triangle, Shirt, Rows3, Footprints, Frame, RectangleVertical, LampFloor, Fan, type LucideIcon,
} from "lucide-react";
import { type ObjectKind } from "@/lib/room-objects";

export const OBJECT_ICON: Record<ObjectKind, LucideIcon> = {
  bed: Bed, sofa: Sofa, counter: CookingPot, table: Utensils, desk: Monitor,
  toilet: Toilet, tub: Bath, sink: Droplet, washer: WashingMachine,
  dresser: Archive, nightstand: Lamp, tv: Tv, fridge: Refrigerator, stove: Flame,
  shower: ShowerHead, wardrobe: DoorClosed, bookshelf: Library, chair: Armchair,
  shell: Hexagon, roof: Triangle,
  closetrod: Shirt, shelving: Rows3, shoerack: Footprints, rug: Frame, mirror: RectangleVertical, lamp: LampFloor, rangehood: Fan,
  door: DoorOpen, window: RectangleHorizontal,
};
