"use client";

/**
 * FITNESS-2525 · Command UX 1
 * ===========================
 * Chrome/layout: Security-2525 Mission PLANNING (dark tactical command network —
 * top status strip, tab rail, left ASSETS-style rail, center stage, right ACTIVE ITEMS,
 * footer PLAN · DRAFT / SHARE / SUBMIT, MIL/eXeL-STD-2525 badges).
 * Energy methodology: Financial Accrual Units hero + REAL-TIME chart pattern
 * (fuel≈income / burn≈expenses / deficit≈net; MoT toggle cal/min · cal/sec · cal/hr).
 * Calories only — no $/kcal pricing. Energy budget: BMR + NEAT + MET workouts;
 * ACSM/ISSN carb windows; WHO/AHA sugar cap; ~10 lb/mo deficit with safety floor.
 * Cloud: innovation_state via fit2525: owner key · fit-day-* · fit-index.
 * AI coach: Worker /api/ai task=draft (OpenAI / Grok / Gemini / Claude).
 * Never invent calorie or weight defaults — leave blank until the athlete sets them.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ComponentType, type ReactNode } from "react";
import {
  Activity, ArrowLeft, Bike, Check, Cloud, CloudOff, Droplets, Footprints,
  LayoutDashboard, Map, Moon, Plus, RefreshCw, Settings, Waves, Zap,
} from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { ExelWordmark } from "@/components/exel-wordmark";
import {
  ownerKeyFor, cloudRead, mergeFitDays, mergeFitIndex, putDay, putIndex,
  nextStamp, PUSH_EVERY_MS, LAST_PUSH_KEY, DEVICE_DAY_KEY, DEVICE_INDEX_KEY,
  type CloudState,
} from "@/lib/fitness-2525/cloud";
import {
  type FitCheckin, type FitDay, type FitIndex, type FitWorkout,
  FIT_INDEX_NAME, dayNamespace, isDeficit, deficitDelta,
} from "@/lib/fitness-2525/types";
import {
  type EnergyRateUnit, intakeDayRates, burnDayRates, workoutBurnRates,
  pickRate, formatCalRate, ratesFromKcal,
} from "@/lib/fitness-2525/energy";
import {
  buildDayBudget, weightToKg, rideFuelingNote, EXAMPLE_ANTHRO, EXAMPLE_STEPS, EXAMPLE_SUGAR_G,
  EXAMPLE_CALORIES_IN, EXAMPLE_CALORIES_OUT, EXAMPLE_WINDOW_INTAKE,
  type OverrunLevel, type WindowBudget, type Anthropometrics,
} from "@/lib/fitness-2525/budget";
import { requestCoachFeedback, aiStatus, anyAi } from "@/lib/fitness-2525/ai";
import styles from "./fitness-2525.module.css";

/** Security-2525 Mission Planning palette (exact). */
const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", gold: "#ffd400", magenta: "#d946ef",
};

const ROUTE = "/Fitness-2525";
const TODAY = "2026-10-05";
const TZ = "America/Chicago";

const NAV: [string, ComponentType<{ className?: string; style?: CSSProperties }>][] = [
  ["TODAY", LayoutDashboard],
  ["ENERGY", Zap],
  ["PLANNING", Map],
  ["NUTRITION", Droplets],
  ["COACH", Activity],
];

type TabId = "TODAY" | "ENERGY" | "PLANNING" | "NUTRITION" | "COACH";
type PlanStatus = "draft" | "pending" | "synced";

function Panel({ title, children, accent, right }: { title: string; children: ReactN