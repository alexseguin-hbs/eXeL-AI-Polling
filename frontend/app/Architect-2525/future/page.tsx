"use client";
// Parallel route /Architect-2525/future. Does not mount the legacy command surface.
import { useEffect, useMemo, useState } from "react";
import {
  DRAFT_ACTOR,
  SOFA,
  STORE_KEY,
  approve,
  arm as armTool,
  clearProgramFt2,
  emptyProject,
  ft,
  grossFt2,
  health,
  mepRollup,
  parseStored,
  place,
  projectHash,
  replay,
  rotate,
  setIntent,
  setJurisdiction,
  setMethod,
  shellFt,
  submit,
  takeoff,
  transformReference,
  type ArmState,
  type FutureProject,
  type Method,
  type SpaceEntityV2,
} from "@/lib/architect-future";

type View = "Plan" | "Design" | "Systems" | "Simulate" | "Review" | "Replay";
type Projection = "Plan" | "3D" | "Walk";

const card = "rounded-xl border border-slate-800 bg-[#0c1424] p-3";
const label = "text-[10px] font-medium uppercase tracking-widest text-slate-500";
const tabIdle = "min-h-11 shrink-0 rounded-md px-3 text-sm text-slate-400";
const tabOn = "min-h-11 shrink-0 rounded-md bg-slate-800 px-3 text-sm text-white";

export default function ArchitectFuture() {
  const [project, setProject] = useState<FutureProject>(emptyProject);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<ArmState>({ armed: null });
  const [view, setView] = useState<View>("Plan");
  const [projection, setProjection] = useState<Projection>("Plan");
  const [bearing, setBearing] = useState(0);
  const [dragX, setDragX] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [occupants, setOccupants] = useState(2);
  const [needs, setNeeds] = useState("A place to live, cook, and sleep");
  const [priority, setPriority] = useState("One model");
  const [method, setMethodChoice] = useState<Method>("UNDECIDED");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stored = parseStored(localStorage.getItem(STORE_KEY));
    if (stored) setProject(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORE_KEY, JSON.stringify(project));
  }, [project, ready]);

  const hash = projectHash(project);
  const replayHash = projectHash(replay(project.events));
  const selectedSpace = project.spaces.find((space) => space.entity_id === selected) ?? null;
  const findings = useMemo(() => health(project), [project]);
  const built = project.spaces.length > 0;

  function begin() {
    const withIntent = setIntent(project.intent ? project : emptyProject(), {
      project_type: "CUSTOM_RESIDENCE",
      occupants: Number.isFinite(occupants) && occupants > 0 ? occupants : 1,
      needs: [needs || "A place to live"],
      accessibility_needs: [],
      priorities: [priority || "One model"],
      construction_preference: method,
      budget_intent: null,
    });
    setProject(transformReference(withIntent));
    setView("Plan");
    setNotice("Reference house created. Arm Sofa, then tap a room once.");
  }

  function onRoom(space: SpaceEntityV2) {
    setSelected(space.entity_id);
    if (!tool.armed) return;
    const next = place(project, tool, space.entity_id);
    setProject(next.project);
    setTool(next.arm);
    setNotice(next.project === project ? "Nothing was placed." : `${next.project.assets.at(-1)?.instance_id ?? "Placed"} in ${space.name}. Disarmed.`);
  }

  return (
    <main className="min-h-dvh bg-[#070b14] pb-24 text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#070b14]/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Architect-2525 <span className="font-normal text-slate-500">Future</span></p>
            <p className="truncate text-[11px] text-slate-500">12 ft outer · 10 ft clear · 1 ft zone · {hash.slice(0, 7)}</p>
          </div>
          <p className="shrink-0 text-[11px] uppercase tracking-wide text-cyan-300">{built ? project.authority.plan : "Draft"}</p>
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto">
          {(["Plan", "Design", "Systems", "Simulate", "Review", "Replay"] as View[]).map((item) => (
            <button key={item} type="button" className={view === item ? tabOn : tabIdle} onClick={() => setView(item)}>{item}</button>
          ))}
        </nav>
      </header>

      <section className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        <Metric k="Shell" v={`${shellFt()} ft`} s="derived" tone="cyan" />
        <Metric k="Clear program" v={`${clearProgramFt2()} ft²`} s="derived" tone="cyan" />
        <Metric k="Gross shell" v={`${grossFt2()} ft²`} s="derived" tone="white" />
        <Metric k="Zone area" v={`${grossFt2() - clearProgramFt2()} ft²`} s="derived" tone="white" />
        <Metric k="Baseline" v={built ? "$240,000" : "—"} s={built ? "assumed · not a quote" : "after the house exists"} tone="amber" />
        <Metric k="Labor" v="Not calculated" s="no accepted quote" tone="white" />
        <Metric k="Recognition" v="Not calculated" s="separate from baseline" tone="white" />
        <Metric k="Rooms" v={built ? "9 spaces" : "not created"} s={built ? "3 wet · 6 dry" : "names only, until you create"} tone="cyan" />
      </section>

      {!built ? (
        <section className="px-3">
          <div className={card}>
            <p className={label}>What are you creating?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-400">People
                <input className="mt-1 min-h-11 w-full rounded-md border border-slate-700 bg-[#070b14] px-2 text-base text-white" type="number" min={1} value={occupants} onChange={(e) => setOccupants(Number(e.target.value))} />
              </label>
              <label className="text-xs text-slate-400">Method
                <select className="mt-1 min-h-11 w-full rounded-md border border-slate-700 bg-[#070b14] px-2 text-base text-white" value={method} onChange={(e) => setMethodChoice(e.target.value as Method)}>
                  <option value="UNDECIDED">Not decided</option>
                  <option value="FRAME">Frame</option>
                  <option value="PRINT">Print</option>
                </select>
              </label>
            </div>
            <label className="mt-2 block text-xs text-slate-400">The home must
              <input className="mt-1 min-h-11 w-full rounded-md border border-slate-700 bg-[#070b14] px-2 text-base text-white" value={needs} onChange={(e) => setNeeds(e.target.value)} />
            </label>
            <button className="mt-3 min-h-11 w-full rounded-md bg-cyan-400 text-sm font-semibold text-slate-950" type="button" onClick={begin}>
              Create the 3×3 reference house
            </button>
          </div>
          <GhostPlan />
        </section>
      ) : null}

      {built && (view === "Plan" || view === "Design") ? (
        <section className="px-3">
          <div className="mb-2 flex gap-1">
            {(["Plan", "3D", "Walk"] as Projection[]).map((item) => (
              <button key={item} type="button" className={`min-h-11 flex-1 rounded-md text-sm ${projection === item ? "bg-slate-800 text-white" : "bg-[#0c1424] text-slate-400"}`} onClick={() => setProjection(item)}>{item}</button>
            ))}
          </div>
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              className={`min-h-11 flex-1 rounded-md px-3 text-left text-sm font-medium ${tool.armed ? "bg-cyan-400 text-slate-950" : "border border-slate-700 bg-[#0c1424] text-white"}`}
              onClick={() => { setTool(armTool(tool, SOFA.asset_id)); setNotice("Sofa armed. Tap one room."); }}
            >
              {tool.armed ? "Sofa armed — tap a room" : "Arm Sofa"}
            </button>
            {selectedSpace ? (
              <button type="button" className="min-h-11 rounded-md border border-slate-700 px-3 text-sm" onClick={() => {
                const asset = project.assets.find((item) => item.space_id === selectedSpace.entity_id);
                if (asset) setProject(rotate(project, asset.instance_id));
              }}>Rotate</button>
            ) : null}
          </div>
          {projection === "Plan" ? (
            <PlanGrid spaces={project.spaces} assets={project.assets} selected={selected} onRoom={onRoom} />
          ) : null}
          {projection === "3D" ? (
            <Orbit
              spaces={project.spaces}
              assets={project.assets}
              bearing={bearing}
              dragX={dragX}
              onDragStart={setDragX}
              onOrbit={setBearing}
              onDragEnd={() => setDragX(null)}
              onRoom={onRoom}
            />
          ) : null}
          {projection === "Walk" ? (
            <Walk space={selectedSpace} spaces={project.spaces} assets={project.assets} onPick={onRoom} />
          ) : null}
          <p className="mt-2 text-[11px] text-slate-500">Orbit and selection do not change the project. {notice}</p>
          {selectedSpace ? (
            <div className={`${card} mt-2`}>
              <p className={label}>{selectedSpace.bay_code} · {selectedSpace.wet}</p>
              <p className="text-lg">{selectedSpace.name}</p>
              <p className="font-mono text-xs text-slate-400">Outer {ft(selectedSpace.outer_width_um)} ft · Clear {ft(selectedSpace.clear_width_um)} ft · Zone {ft(selectedSpace.wall_zone_thickness_um)} ft</p>
              {project.assets.filter((asset) => asset.space_id === selectedSpace.entity_id).map((asset) => (
                <p key={asset.instance_id} className="mt-1 font-mono text-xs text-cyan-300">{asset.name} · {asset.instance_id} · {asset.rotation_deg}°</p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {built && view === "Systems" ? (
        <section className="flex flex-col gap-2 px-3">
          <div className="grid grid-cols-3 gap-2">
            {(["UNDECIDED", "FRAME", "PRINT"] as Method[]).map((item) => (
              <button key={item} type="button" className={`min-h-11 rounded-md text-sm ${project.construction.method === item ? "bg-cyan-400 font-semibold text-slate-950" : "bg-[#0c1424] text-slate-300"}`} onClick={() => setProject(setMethod(project, item))}>
                {item === "UNDECIDED" ? "Undecided" : item === "FRAME" ? "Frame" : "Print"}
              </button>
            ))}
          </div>
          {takeoff(project).length === 0 ? <p className="text-sm text-slate-500">Take-off not calculated until a method is chosen.</p> : null}
          {takeoff(project).map((line) => (
            <div key={line.item} className={card}>
              <p className="font-medium">{line.item}</p>
              <p className="font-mono text-xs text-slate-500">{line.method} · {line.evidence}</p>
              <p className="text-sm text-slate-400">{line.note}</p>
            </div>
          ))}
        </section>
      ) : null}

      {built && view === "Simulate" ? (
        <section className="flex flex-col gap-2 px-3 text-sm">
          <div className={card}>
            <p className={label}>Baseline build estimate · {project.economics.baseline.total_evidence}</p>
            <p className="mt-1 font-mono text-2xl text-amber-400">${project.economics.baseline.total_usd.toLocaleString("en-US")}</p>
            <p className="text-xs text-slate-500">{project.economics.baseline.per_net_ft2} USD per net ft² · derived from the assumed baseline, not a market quote</p>
            <ul className="mt-2 space-y-1">
              {project.economics.baseline.sections.map((section) => (
                <li key={section.id} className="flex justify-between gap-3 font-mono text-xs text-slate-300">
                  <span>{section.name}</span><span>{section.usd.toLocaleString("en-US")} · {section.evidence}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 font-mono text-xs text-slate-500">MEP {mepRollup(project).usd.toLocaleString("en-US")} · display rollup only</p>
          </div>
          <div className={card}><p className={label}>Labor · {project.economics.labor.evidence}</p><p className="mt-1">Not calculated.</p></div>
          <div className={card}><p className={label}>Recognition · {project.economics.recognition.evidence}</p><p className="mt-1">Not calculated.</p></div>
          <div className={card}>
            <p className={label}>Local settlement · {project.economics.settlement.evidence}</p>
            <select className="mt-2 min-h-11 w-full rounded-md border border-slate-700 bg-[#070b14] px-2" value={project.economics.settlement.jurisdiction_id} onChange={(event) => setProject(setJurisdiction(project, event.target.value))}>
              <option value="US-TX">US-TX</option>
              <option value="NG">NG</option>
              <option value="BR">BR</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">Jurisdiction does not change the baseline, labor, or recognition.</p>
          </div>
        </section>
      ) : null}

      {built && view === "Review" ? (
        <section className="flex flex-col gap-2 px-3 text-sm">
          <p className="text-slate-400">Actor is an unauthenticated human. Approval stays closed.</p>
          <button className="min-h-11 rounded-md bg-cyan-400 font-semibold text-slate-950" type="button" onClick={() => { setProject(submit(project)); setNotice("Submitted. Submit is not approval."); }}>Submit for review</button>
          <button className="min-h-11 rounded-md border border-slate-700" type="button" onClick={() => {
            const result = approve(project, DRAFT_ACTOR);
            setProject(result.project);
            setNotice(result.accepted ? "Approved." : "Not approved. An authenticated human is required.");
          }}>Approve</button>
          {findings.map((finding) => (
            <div key={finding.id} className={card}>
              <p className={finding.ok ? "text-cyan-300" : "text-amber-400"}>{finding.ok ? "Holds" : "Open"}</p>
              <p>{finding.text}</p>
            </div>
          ))}
        </section>
      ) : null}

      {built && view === "Replay" ? (
        <section className="px-3 text-sm">
          <p className="font-mono text-xs text-slate-500">Live {hash.slice(0, 12)} · Replay {replayHash.slice(0, 12)} · {hash === replayHash ? "match" : "diverged"}</p>
          <ol className="mt-2 space-y-2">
            {project.events.map((event, index) => (
              <li key={`${event.event_type}-${index}`} className={`${card} font-mono text-xs`}>{index + 1}. {event.event_type}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {notice ? <p className="px-3 pt-3 text-sm text-cyan-200">{notice}</p> : null}
    </main>
  );
}

function Metric({ k, v, s, tone }: { k: string; v: string; s: string; tone: "cyan" | "amber" | "white" }) {
  const color = tone === "cyan" ? "text-cyan-300" : tone === "amber" ? "text-amber-400" : "text-white";
  return (
    <div className={card}>
      <p className={label}>{k}</p>
      <p className={`mt-1 text-lg font-semibold leading-tight ${color}`}>{v}</p>
      <p className="mt-1 text-[11px] text-slate-500">{s}</p>
    </div>
  );
}

const GHOST = ["Bedroom", "Bath", "Closet", "Living", "Kitchen", "Dining", "Office", "Utility", "Entry"];

function GhostPlan() {
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5 opacity-60">
      {GHOST.map((name) => (
        <div key={name} className="flex min-h-16 items-end rounded-lg border border-slate-800 bg-[#0c1424] p-2 text-xs text-slate-400">{name}</div>
      ))}
    </div>
  );
}

function rowsOf(spaces: SpaceEntityV2[]) {
  return [2, 1, 0].flatMap((row) => spaces.filter((space) => Math.round(space.outer_y_um / space.outer_depth_um) === row));
}

function PlanGrid({ spaces, assets, selected, onRoom }: { spaces: SpaceEntityV2[]; assets: FutureProject["assets"]; selected: string | null; onRoom: (space: SpaceEntityV2) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {rowsOf(spaces).map((space) => {
        const here = assets.filter((asset) => asset.space_id === space.entity_id);
        return (
          <button key={space.entity_id} type="button" className={`min-h-24 rounded-lg border p-2 text-left ${selected === space.entity_id ? "border-cyan-400 bg-[#102033]" : "border-slate-800 bg-[#0c1424]"}`} onClick={() => onRoom(space)}>
            <span className="block text-sm font-medium">{space.name}</span>
            <span className="font-mono text-[10px] text-slate-500">{space.bay_code}{space.wet === "WET" ? " · wet" : ""}</span>
            {here.map((asset) => <span key={asset.instance_id} className="mt-2 block font-mono text-[11px] text-cyan-300">{asset.instance_id}</span>)}
          </button>
        );
      })}
    </div>
  );
}

function Orbit({
  spaces, assets, bearing, dragX, onDragStart, onOrbit, onDragEnd, onRoom,
}: {
  spaces: SpaceEntityV2[];
  assets: FutureProject["assets"];
  bearing: number;
  dragX: number | null;
  onDragStart: (x: number) => void;
  onOrbit: (delta: number) => void;
  onDragEnd: () => void;
  onRoom: (space: SpaceEntityV2) => void;
}) {
  const turn = (bearing * Math.PI) / 180;
  return (
    <div
      className="relative h-80 overflow-hidden rounded-xl border border-slate-800 bg-[#0c1424]"
      onPointerDown={(event) => { if (event.target === event.currentTarget) onDragStart(event.clientX); }}
      onPointerMove={(event) => { if (dragX !== null) onOrbit(event.clientX - dragX); }}
      onPointerUp={onDragEnd}
    >
      <p className="pointer-events-none absolute left-3 top-3 text-[11px] text-slate-500">Drag empty space to orbit. {bearing}°. Not saved.</p>
      {spaces.map((space) => {
        const col = space.outer_x_um / space.outer_width_um - 1;
        const row = space.outer_y_um / space.outer_depth_um - 1;
        const x = col * Math.cos(turn) - row * Math.sin(turn);
        const y = col * Math.sin(turn) + row * Math.cos(turn);
        const here = assets.filter((asset) => asset.space_id === space.entity_id);
        return (
          <button
            key={space.entity_id}
            type="button"
            className="absolute w-20 rounded-md border border-cyan-400/70 bg-[#070b14] p-1 text-center text-xs"
            style={{ left: `calc(50% + ${x * 78}px)`, top: `calc(46% + ${y * 46}px)`, transform: "translate(-50%, -50%)" }}
            onClick={() => onRoom(space)}
          >
            {space.name}
            {here.map((asset) => <span key={asset.instance_id} className="block font-mono text-[10px] text-cyan-300">{asset.instance_id}</span>)}
          </button>
        );
      })}
    </div>
  );
}

function Walk({ space, spaces, assets, onPick }: { space: SpaceEntityV2 | null; spaces: SpaceEntityV2[]; assets: FutureProject["assets"]; onPick: (space: SpaceEntityV2) => void }) {
  const here = space ? assets.filter((asset) => asset.space_id === space.entity_id) : [];
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0c1424]">
      <div className="flex h-48 flex-col items-center justify-end p-4">
        {here.length === 0 ? <p className="text-sm text-slate-500">{space ? `Nothing saved in ${space.name}` : "Tap a room"}</p> : null}
        {here.map((asset) => (
          <div key={asset.instance_id} className="mb-2 rounded-md border border-cyan-400 px-4 py-3 text-center" style={{ transform: `rotate(${asset.rotation_deg}deg)` }}>
            <p>{asset.name}</p>
            <p className="font-mono text-xs text-cyan-300">{asset.instance_id}</p>
          </div>
        ))}
        <p className="text-lg">{space ? space.name : "Walk"}</p>
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {rowsOf(spaces).map((room) => (
          <button key={room.entity_id} type="button" className={`min-h-11 rounded-md text-xs ${space?.entity_id === room.entity_id ? "bg-cyan-400 font-semibold text-slate-950" : "bg-[#070b14] text-slate-300"}`} onClick={() => onPick(room)}>{room.name}</button>
        ))}
      </div>
    </div>
  );
}
