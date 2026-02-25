"use client";

import { useState, useEffect } from "react";
import { useLexicon } from "@/lib/lexicon-context";

// ── Types ────────────────────────────────────────────────────────

type Phase = "days" | "hours" | "minutes" | "seconds" | "ended";

interface TimeRemaining {
  totalSeconds: number;
  phase: Phase;
  value: number; // display value in center
  segments: number; // total segments for this phase
  filled: number; // how many segments are filled (remaining)
}

interface PollCountdownTimerProps {
  endsAt: string;
  totalDays: number;
  displayMode: "day" | "flex" | "both";
  accentColor: string;
}

// ── useCountdown hook ────────────────────────────────────────────

function useCountdown(endsAt: string, totalDays: number): TimeRemaining {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const endMs = new Date(endsAt).getTime();
  const totalSeconds = Math.max(0, Math.floor((endMs - now) / 1000));

  if (totalSeconds <= 0) {
    return { totalSeconds: 0, phase: "ended", value: 0, segments: 0, filled: 0 };
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60);

  // For 1-day polls, skip days phase and start in hours
  if (totalDays <= 1 || days === 0) {
    if (hours >= 1) {
      const hoursRemaining = Math.ceil(totalSeconds / 3600);
      return { totalSeconds, phase: "hours", value: hours, segments: 24, filled: Math.min(hoursRemaining, 24) };
    }
    if (minutes >= 1) {
      const minsRemaining = Math.ceil(totalSeconds / 60);
      return { totalSeconds, phase: "minutes", value: minutes, segments: 60, filled: Math.min(minsRemaining, 60) };
    }
    return { totalSeconds, phase: "seconds", value: totalSeconds, segments: 60, filled: totalSeconds };
  }

  // Multi-day polls
  if (days >= 1) {
    const daysRemaining = Math.ceil(totalSeconds / 86400);
    return { totalSeconds, phase: "days", value: days, segments: totalDays, filled: Math.min(daysRemaining, totalDays) };
  }
  if (hours >= 1) {
    const hoursRemaining = Math.ceil(totalSeconds / 3600);
    return { totalSeconds, phase: "hours", value: hours, segments: 24, filled: Math.min(hoursRemaining, 24) };
  }
  if (minutes >= 1) {
    const minsRemaining = Math.ceil(totalSeconds / 60);
    return { totalSeconds, phase: "minutes", value: minutes, segments: 60, filled: Math.min(minsRemaining, 60) };
  }
  return { totalSeconds, phase: "seconds", value: totalSeconds, segments: 60, filled: totalSeconds };
}

// ── SVG segment arc path ─────────────────────────────────────────

function segmentPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cos = Math.cos;
  const sin = Math.sin;

  const s = toRad(startAngle);
  const e = toRad(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  const outerStart = { x: cx + outerR * cos(s), y: cy + outerR * sin(s) };
  const outerEnd = { x: cx + outerR * cos(e), y: cy + outerR * sin(e) };
  const innerStart = { x: cx + innerR * cos(e), y: cy + innerR * sin(e) };
  const innerEnd = { x: cx + innerR * cos(s), y: cy + innerR * sin(s) };

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

// ── Phase label map ──────────────────────────────────────────────

const PHASE_LABEL_KEYS: Record<Phase, string> = {
  days: "cube1.timer.days",
  hours: "cube1.timer.hours",
  minutes: "cube1.timer.minutes",
  seconds: "cube1.timer.seconds",
  ended: "cube1.timer.poll_ended",
};

// ── Flex Timer (SVG) ─────────────────────────────────────────────

function FlexTimer({
  countdown,
  accentColor,
}: {
  countdown: TimeRemaining;
  accentColor: string;
}) {
  const { t } = useLexicon();
  const cx = 100;
  const cy = 100;
  const outerR = 88;
  const innerR = 62;
  const borderColor = "hsl(var(--border))";
  const { phase, value, segments, filled } = countdown;

  if (phase === "ended") {
    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 200" width={160} height={160}>
          <circle cx={cx} cy={cy} r={90} fill="none" stroke={borderColor} strokeWidth={1.5} />
          <circle cx={cx} cy={cy} r={60} fill="none" stroke={borderColor} strokeWidth={1.5} />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={14} fill="hsl(var(--muted-foreground))">
            {t("cube1.timer.poll_ended")}
          </text>
        </svg>
      </div>
    );
  }

  if (segments === 0) return null;

  const gapDeg = 1; // 1° gap between segments for gradation lines
  const totalGap = gapDeg * segments;
  const availableDeg = 360 - totalGap;
  const segDeg = availableDeg / segments;

  const segmentPaths = [];
  for (let i = 0; i < segments; i++) {
    const startAngle = -90 + i * (segDeg + gapDeg);
    const endAngle = startAngle + segDeg;
    const isFilled = i < filled;

    segmentPaths.push(
      <path
        key={i}
        d={segmentPath(cx, cy, innerR, outerR, startAngle, endAngle)}
        fill={isFilled ? accentColor : "transparent"}
        opacity={isFilled ? 0.85 : 0.1}
      />
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" width={160} height={160}>
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={90} fill="none" stroke={borderColor} strokeWidth={1.5} />
        {/* Inner ring */}
        <circle cx={cx} cy={cy} r={60} fill="none" stroke={borderColor} strokeWidth={1.5} />
        {/* Segment arcs */}
        {segmentPaths}
        {/* Center value */}
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={28}
          fontWeight="bold"
          fill="hsl(var(--foreground))"
        >
          {value}
        </text>
        {/* Phase label */}
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          fontSize={10}
          fill="hsl(var(--muted-foreground))"
        >
          {t(PHASE_LABEL_KEYS[phase])}
        </text>
      </svg>
    </div>
  );
}

// ── Day Timer (text) ─────────────────────────────────────────────

function DayTimer({ endsAt }: { endsAt: string }) {
  const { t } = useLexicon();
  const endDate = new Date(endsAt);
  const now = Date.now();
  const ended = endDate.getTime() <= now;

  if (ended) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("cube1.timer.poll_ended")}
      </p>
    );
  }

  const dateStr = endDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timeStr = endDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <p className="text-sm text-muted-foreground">
      {t("cube1.timer.poll_ends")} {dateStr} {t("cube1.timer.at")} {timeStr}
    </p>
  );
}

// ── Exported Component ───────────────────────────────────────────

export function PollCountdownTimer({
  endsAt,
  totalDays,
  displayMode,
  accentColor,
}: PollCountdownTimerProps) {
  const countdown = useCountdown(endsAt, totalDays);

  if (displayMode === "day") {
    return (
      <div className="w-full max-w-lg mb-4 flex justify-center">
        <DayTimer endsAt={endsAt} />
      </div>
    );
  }

  if (displayMode === "flex") {
    return (
      <div className="w-full max-w-lg mb-4 flex justify-center">
        <FlexTimer countdown={countdown} accentColor={accentColor} />
      </div>
    );
  }

  // "both" — side by side
  return (
    <div className="w-full max-w-lg mb-4 flex items-center justify-center gap-4">
      <FlexTimer countdown={countdown} accentColor={accentColor} />
      <DayTimer endsAt={endsAt} />
    </div>
  );
}
