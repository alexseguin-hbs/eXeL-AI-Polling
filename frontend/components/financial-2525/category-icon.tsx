"use client";
/**
 * Financial-2525 · the icon of a personal-finance category (operator 2026-09-30, addendum 19: "Ensure all have icons —
 * Income · Mortgage · Car · Insurance · Food · Fitness · Fun", with his PERSONAL sheet, which draws one before every line).
 * THE LAW: every BudgetCategory has exactly one icon here — the seven he named, and the three the sheet does not name
 * (Utilities = the sheet's Electric bolt · Dining Out · Other) — so no line on the glass is ever bare. Strokes only (the
 * vector law), aria-hidden: the word beside it carries the meaning; the icon never replaces it. Gated by
 * tests/financial-surface.test.mjs (the map's keys === BUDGET_CATEGORIES).
 */
import { Banknote, House, Car, ShieldCheck, Zap, Dumbbell, PartyPopper, ShoppingBasket, UtensilsCrossed, CircleEllipsis, type LucideIcon } from "lucide-react";
import type { BudgetCategory } from "@/lib/financial-2525/budget";

export const CATEGORY_ICON: Record<BudgetCategory, LucideIcon> = {
  Income: Banknote,          // the sheet's banknote before Income 3200 F
  Home: House,               // the house before Home (Mortgage/Rent) 700 F
  Auto: Car,                 // the car before CAR 1,800 F
  Insurance: ShieldCheck,    // the circled mark before INSURANCE 200 F
  Utilities: Zap,            // the bolt before Electric 150 V
  Groceries: ShoppingBasket, // the plate before FOOD 300 V
  "Dining Out": UtensilsCrossed,
  Fitness: Dumbbell,         // the lifting figure before Fitness 50 F
  Fun: PartyPopper,          // the dancing figure before FUN 200 V
  Other: CircleEllipsis,
};

/** One stroke icon, sized to the text beside it; never a fill, never alone. */
export function CategoryIcon({ category, size = 14, className = "" }: { category: BudgetCategory; size?: number; className?: string }) {
  const Icon = CATEGORY_ICON[category] ?? CircleEllipsis;
  return <Icon size={size} strokeWidth={1.5} aria-hidden className={`inline-block shrink-0 align-[-2px] ${className}`} data-fin-cat-icon={category} />;
}
