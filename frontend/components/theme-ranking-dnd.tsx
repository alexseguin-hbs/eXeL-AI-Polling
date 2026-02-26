"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLexicon } from "@/lib/lexicon-context";
import type { SimTheme } from "@/lib/types";

// ── Sortable Theme Item ──────────────────────────────────────────

function SortableThemeItem({
  theme,
  rank,
  submitted,
}: {
  theme: SimTheme;
  rank: number;
  submitted: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: theme.id, disabled: submitted });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { t } = useLexicon();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border-2 p-3 min-h-14 transition-colors ${
        isDragging
          ? "opacity-40 border-dashed border-muted-foreground/30 bg-muted/20"
          : submitted
          ? "border-border bg-card"
          : "border-border bg-card hover:border-primary/30 hover:bg-accent/10"
      }`}
    >
      {/* Left accent border */}
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: theme.color }}
      />

      {/* Grip handle or checkmark */}
      <div
        className={`flex items-center justify-center w-11 h-11 shrink-0 touch-none ${
          submitted ? "" : "cursor-grab active:cursor-grabbing"
        }`}
        {...(submitted ? {} : { ...attributes, ...listeners })}
      >
        {submitted ? (
          <CheckCircle2 className="h-5 w-5 text-green-400" />
        ) : (
          <GripVertical className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </div>

      {/* Rank badge */}
      <span
        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: theme.color }}
      >
        {t("cube10.sim.rank_number").replace("{0}", String(rank))}
      </span>

      {/* Theme info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{theme.icon}</span>
          <p className="text-sm font-medium truncate">{theme.name}</p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {theme.responseCount} {t("cube10.sim.responses_count")} &middot;{" "}
          {Math.round(theme.confidence * 100)}% {t("cube10.sim.confidence")}
        </p>
      </div>
    </div>
  );
}

// ── Drag Overlay Item (floating ghost) ───────────────────────────

function DragOverlayItem({
  theme,
  rank,
}: {
  theme: SimTheme;
  rank: number;
}) {
  const { t } = useLexicon();

  return (
    <div
      className="flex items-center gap-3 rounded-lg border-2 border-primary p-3 min-h-14 bg-card shadow-lg scale-[1.02]"
    >
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: theme.color }}
      />
      <div className="flex items-center justify-center w-11 h-11 shrink-0">
        <GripVertical className="h-5 w-5 text-primary" />
      </div>
      <span
        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: theme.color }}
      >
        {t("cube10.sim.rank_number").replace("{0}", String(rank))}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{theme.icon}</span>
          <p className="text-sm font-medium truncate">{theme.name}</p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {theme.responseCount} {t("cube10.sim.responses_count")} &middot;{" "}
          {Math.round(theme.confidence * 100)}% {t("cube10.sim.confidence")}
        </p>
      </div>
    </div>
  );
}

// ── Main DnD Ranking Component ───────────────────────────────────

export function ThemeRankingDnD({
  themes,
  onComplete,
}: {
  themes: SimTheme[];
  onComplete: () => void;
}) {
  const [orderedThemes, setOrderedThemes] = useState<SimTheme[]>(themes);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [defaultAccepted, setDefaultAccepted] = useState(false);
  const { t } = useLexicon();

  // Enable submit after first drag OR after 2s timeout (accept default order)
  useEffect(() => {
    const timer = setTimeout(() => setDefaultAccepted(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const canSubmit = (hasDragged || defaultAccepted) && !submitted;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setHasDragged(true);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setOrderedThemes((prev) => {
          const oldIndex = prev.findIndex((th) => th.id === active.id);
          const newIndex = prev.findIndex((th) => th.id === over.id);
          return arrayMove(prev, oldIndex, newIndex);
        });
      }
    },
    []
  );

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  }, [onComplete]);

  const activeTheme = activeId
    ? orderedThemes.find((th) => th.id === activeId)
    : null;
  const activeRank = activeTheme
    ? orderedThemes.indexOf(activeTheme) + 1
    : 0;

  const totalResponses = orderedThemes.reduce(
    (sum, th) => sum + th.responseCount,
    0
  );

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">
          {t("cube10.sim.rank_themes")}
        </CardTitle>
        <CardDescription>{t("cube7.ranking.drag_hint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Theming analysis banner */}
        <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-center mb-2">
          <p className="text-xs text-primary">
            {t("cube10.sim.theming_complete")} &mdash;{" "}
            {t("cube10.sim.responses_to_themes")
              .replace("{0}", String(totalResponses))
              .replace("{1}", String(orderedThemes.length))}
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart({ active }) {
                const idx = orderedThemes.findIndex((th) => th.id === active.id);
                return `Picked up theme at position ${idx + 1}`;
              },
              onDragOver({ active, over }) {
                if (over) {
                  const idx = orderedThemes.findIndex((th) => th.id === over.id);
                  return `Theme is over position ${idx + 1}`;
                }
                return "Theme is not over a droppable area";
              },
              onDragEnd({ active, over }) {
                if (over) {
                  const idx = orderedThemes.findIndex((th) => th.id === over.id);
                  return `Theme dropped at position ${idx + 1}`;
                }
                return "Theme dropped";
              },
              onDragCancel() {
                return "Drag cancelled";
              },
            },
          }}
        >
          <SortableContext
            items={orderedThemes.map((th) => th.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedThemes.map((theme, index) => (
              <SortableThemeItem
                key={theme.id}
                theme={theme}
                rank={index + 1}
                submitted={submitted}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeTheme ? (
              <DragOverlayItem theme={activeTheme} rank={activeRank} />
            ) : null}
          </DragOverlay>
        </DndContext>

        {submitted && (
          <div className="flex flex-col items-center gap-2 pt-2">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
            <p className="text-sm text-green-400 font-medium">
              {t("cube10.sim.rankings_submitted")}
            </p>
          </div>
        )}
      </CardContent>
      {!submitted && (
        <CardFooter>
          <Button
            className="w-full"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {t("cube7.ranking.confirm_order")}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
