"use client";

import { useState, useMemo } from "react";
import { X, ChevronDown, ChevronUp, Lock, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ThemedResponse, ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";

interface ResponseDrawerProps {
  theme: ThemeInfo;
  responses: ThemedResponse[];
  accentColor: string;
  onClose: () => void;
  /** Whether user has paid tier access (unlocks 333 + original) */
  isPaidTier?: boolean;
}

type SummaryLevel = "33" | "111" | "333" | "original";

const PAGE_SIZE = 20;

const SUMMARY_LEVELS: { key: SummaryLevel; label: string; paid: boolean }[] = [
  { key: "33", label: "33 words", paid: false },
  { key: "111", label: "111 words", paid: false },
  { key: "333", label: "333 words", paid: true },
  { key: "original", label: "Original", paid: true },
];

export function ResponseDrawer({
  theme,
  responses,
  accentColor,
  onClose,
  isPaidTier = false,
}: ResponseDrawerProps) {
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [summaryLevel, setSummaryLevel] = useState<SummaryLevel>("33");
  const [isMaximized, setIsMaximized] = useState(false);

  const totalPages = Math.ceil(responses.length / PAGE_SIZE);
  const pageResponses = useMemo(
    () => responses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [responses, page]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSummaryText = (r: ThemedResponse): string => {
    switch (summaryLevel) {
      case "33":
        return r.summary33;
      case "111":
        return r.summary111;
      case "333":
        return isPaidTier ? r.summary333 : r.summary33;
      case "original":
        return isPaidTier ? r.rawText : r.summary33;
    }
  };

  return (
    <div
      className="flower-slide-up"
      style={{
        position: isMaximized ? "fixed" : "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        top: isMaximized ? 0 : undefined,
        maxHeight: isMaximized ? "100%" : "65%",
        background: "hsl(183, 30%, 7%)",
        borderTop: isMaximized ? "none" : `2px solid ${accentColor}`,
        borderRadius: isMaximized ? 0 : "12px 12px 0 0",
        display: "flex",
        flexDirection: "column",
        zIndex: isMaximized ? 70 : 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid hsl(183, 33%, 17%)",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: accentColor,
                flexShrink: 0,
              }}
            />
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "hsl(210, 40%, 98%)",
                margin: 0,
              }}
            >
              {theme.label}
            </h3>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "hsl(183, 11%, 64%)",
              marginTop: 2,
              marginLeft: 18,
            }}
          >
            {theme.count.toLocaleString()} responses &middot;{" "}
            {theme.avgConfidence}% avg confidence
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized((m) => !m)}
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary level selector */}
      <div
        style={{
          padding: "8px 16px",
          display: "flex",
          gap: 4,
          borderBottom: "1px solid hsl(183, 33%, 17%)",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "hsl(183, 11%, 64%)",
            alignSelf: "center",
            marginRight: 4,
          }}
        >
          View:
        </span>
        {SUMMARY_LEVELS.map(({ key, label, paid }) => {
          const isActive = summaryLevel === key;
          const isLocked = paid && !isPaidTier;

          return (
            <button
              key={key}
              onClick={() => {
                if (!isLocked) setSummaryLevel(key);
              }}
              style={{
                padding: "3px 10px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                border: `1px solid ${isActive ? accentColor : "hsl(183, 33%, 22%)"}`,
                background: isActive
                  ? `${accentColor}22`
                  : "transparent",
                color: isLocked
                  ? "hsl(183, 11%, 45%)"
                  : isActive
                    ? accentColor
                    : "hsl(183, 11%, 64%)",
                cursor: isLocked ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
                transition: "all 0.2s ease",
              }}
            >
              {isLocked && <Lock style={{ width: 9, height: 9 }} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Response list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px",
        }}
      >
        {pageResponses.map((r, i) => {
          const isExpanded = expandedIds.has(r.id);
          return (
            <div key={r.id}>
              <div
                style={{
                  padding: "10px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {/* Row header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "hsl(183, 11%, 50%)",
                        fontFamily: "monospace",
                        minWidth: 24,
                      }}
                    >
                      {(page * PAGE_SIZE + i + 1).toString().padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: "hsl(183, 11%, 64%)",
                      }}
                    >
                      {r.userHash}
                    </span>
                  </div>

                  {/* Confidence bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 4,
                        borderRadius: 2,
                        background: "hsl(183, 33%, 17%)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${r.theme2Confidence}%`,
                          height: "100%",
                          borderRadius: 2,
                          background: accentColor,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        color: "hsl(183, 11%, 50%)",
                        fontVariantNumeric: "tabular-nums",
                        minWidth: 28,
                      }}
                    >
                      {r.theme2Confidence}%
                    </span>
                  </div>
                </div>

                {/* Summary text */}
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "hsl(210, 40%, 93%)",
                    paddingLeft: 32,
                  }}
                >
                  {isExpanded ? r.rawText : getSummaryText(r)}
                </div>

                {/* Expand/collapse toggle */}
                <button
                  onClick={() => toggleExpand(r.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    paddingLeft: 32,
                    fontSize: 11,
                    color: accentColor,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    opacity: 0.7,
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp style={{ width: 12, height: 12 }} />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown style={{ width: 12, height: 12 }} />
                      Full response
                    </>
                  )}
                </button>
              </div>
              {i < pageResponses.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderTop: "1px solid hsl(183, 33%, 17%)",
            flexShrink: 0,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ fontSize: 12 }}
          >
            Prev
          </Button>
          <span
            style={{
              fontSize: 12,
              color: "hsl(183, 11%, 64%)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ fontSize: 12 }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
