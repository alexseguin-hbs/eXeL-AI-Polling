/**
 * Master of Thought emblem config — Supabase load/save/subscribe.
 *
 * The single-row table `mot_emblem_config` (id='current') holds the live
 * placement of the MoT cuneiform arcs. The Admin Console (Thought Master)
 * edit panel writes here; every connected client loads the row on mount
 * and subscribes to Realtime updates so inscriptions propagate globally.
 */

import { supabase } from "@/lib/supabase";
import type { CuneiformArc } from "@/components/master-of-thought";

export interface MotConfig {
  center: { cx: number; cy: number };
  outerArcs: CuneiformArc[];
  innerArc: CuneiformArc;
  updatedAt?: string;
}

interface MotConfigRow {
  id: string;
  center_cx: number;
  center_cy: number;
  outer_arcs: CuneiformArc[];
  inner_arc: CuneiformArc;
  updated_at: string;
  updated_by?: string | null;
}

function rowToConfig(row: MotConfigRow): MotConfig {
  return {
    center: { cx: Number(row.center_cx), cy: Number(row.center_cy) },
    outerArcs: row.outer_arcs,
    innerArc: row.inner_arc,
    updatedAt: row.updated_at,
  };
}

/** Load the current emblem config. Returns null if Supabase is unavailable
 *  or the row doesn't exist — caller should fall back to DEFAULT_* in that case. */
export async function loadMotConfig(): Promise<MotConfig | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("mot_emblem_config")
    .select("*")
    .eq("id", "current")
    .maybeSingle();
  if (error || !data) return null;
  return rowToConfig(data as MotConfigRow);
}

/** Save the emblem config (INSCRIBE). Returns true on success. */
export async function saveMotConfig(cfg: MotConfig, inscribedBy = "thought_master"): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("mot_emblem_config")
    .upsert({
      id: "current",
      center_cx: cfg.center.cx,
      center_cy: cfg.center.cy,
      outer_arcs: cfg.outerArcs,
      inner_arc: cfg.innerArc,
      updated_by: inscribedBy,
    });
  return !error;
}

/** Subscribe to live updates on the current row. Returns an unsubscribe fn. */
export function subscribeMotConfig(onChange: (cfg: MotConfig) => void): () => void {
  if (!supabase) return () => {};
  const client = supabase;
  const channel = client.channel("mot_emblem_config_changes");
  channel
    .on(
      "postgres_changes" as never,
      { event: "*", schema: "public", table: "mot_emblem_config" },
      (payload: { new?: MotConfigRow | null }) => {
        const row = payload.new;
        if (row && row.id === "current") onChange(rowToConfig(row));
      },
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
