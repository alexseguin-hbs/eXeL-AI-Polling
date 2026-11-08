"use client";
// Parallel route /Architect-2525/future. Does not mount the legacy command surface.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DRAFT_ACTOR,
  SOFA,
  STORE_KEY,
  VISION_GROUPS,
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

export default function ArchitectFuture() {
  const [project, setProject] = useState<FutureProject>(emptyProject);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<ArmState>({ armed: null });
  const [view, setView] = useState<View>("Plan");
  const [projection, setProjection] = useState<Projection>("Plan");
  const [bearing, setBearing] = useState(0);
  const [dragX, setDragX] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);
  const [activeOpen, setActiveOpen] = useState(false);
  const [occupants, setOccupants] = useState(2);
  const [needs, setNeeds] = useState("A place to live, cook, and sleep");
  const [priority, setPriority] = useState("One model, no second house hiding behind it");
  const [access, setAccess] = useState("");
  const [method, setMethodChoice] = useState<Method>("UNDECIDED");
  const [budget, setBudget] = useState("");
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

  function selectRoom(space: SpaceEntityV2) {
    setSelected(space.entity_id);
  }

  function onRoom(space: SpaceEntityV2) {
    setSelected(space.entity_id);
    if (!tool.armed) {
      setActiveOpen(true);
      return;
    }
    const next = place(project, tool, space.entity_id);
    setProject(next.project);
    setTool(next.arm);
    setNotice(next.project === project ? "Nothing was placed." : "One placement. The tool is disarmed.");
    setActiveOpen(true);
  }

  if (!project.intent) {
    return (
      <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
        <header className="border-b border-border px-4 py-4">
          <p className="font-mono text-xs tracking-widest text-primary">ARCHITECT 2525 · FUTURE</p>
          <h1 className="mt-1 text-2xl leading-tight">What are you creating?</h1>
        </header>
        <form
          className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6"
          onSubmit={(event) => {
            event.preventDefault();
            const amount = Number(budget);
            setProject(setIntent(emptyProject(), {
              project_type: "CUSTOM_RESIDENCE",
              occupants,
              needs: [needs],
              accessibility_needs: access ? [access] : [],
              priorities: [priority],
              construction_preference: method,
              budget_intent: Number.isFinite(amount) && amount > 0 ? { amount_usd: Math.round(amount), authority: "USER_STATED" } : null,
            }));
          }}
        >
          <Field label="Who will use it?">
            <input className="min-h-11 w-full border border-border bg-background px-2" type="number" min={1} value={occupants} onChange={(e) => setOccupants(Number(e.target.value))} />
          </Field>
          <Field label="What must the home do?">
            <textarea className="min-h-24 w-full border border-border bg-background px-2 py-2" value={needs} onChange={(e) => setNeeds(e.target.value)} />
          </Field>
          <Field label="What matters most?">
            <textarea className="min-h-20 w-full border border-border bg-background px-2 py-2" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </Field>
          <Field label="Access needs, if any">
            <input className="min-h-11 w-full border border-border bg-background px-2" value={access} onChange={(e) => setAccess(e.target.value)} />
          </Field>
          <Field label="Construction, if you already know">
            <select className="min-h-11 w-full border border-border bg-background px-2" value={method} onChange={(e) => setMethodChoice(e.target.value as Method)}>
              <option value="UNDECIDED">Not decided</option>
              <option value="FRAME">Frame</option>
              <option value="PRINT">Print</option>
            </select>
          </Field>
          <Field label="A budget you are stating, optional. This is not an estimate.">
            <input className="min-h-11 w-full border border-border bg-background px-2" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Leave blank if unknown" />
          </Field>
          <button className="min-h-11 bg-primary px-4 text-primary-foreground" type="submit">Continue</button>
        </form>
      </main>
    );
  }

  if (project.spaces.length === 0) {
    return (
      <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
        <header className="border-b border-border px-4 py-4">
          <p className="font-mono text-xs tracking-widest text-primary">INTENT RECORDED</p>
          <h1 className="mt-1 text-2xl">Create the reference house</h1>
        </header>
        <section className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-6 text-sm leading-relaxed">
          <p>The historical program contributes nine room names and which rooms are wet. The geometry is new.</p>
          <ul className="space-y-1 font-mono text-xs text-muted-foreground">
            <li>12 ft outer module</li>
            <li>10 ft clear room</li>
            <li>1 ft reserved wall / service zone, not a measured wall thickness</li>
            <li>36 ft shell, derived</li>
            <li>{clearProgramFt2()} ft² clear program, derived</li>
            <li>{grossFt2()} ft² gross shell, derived</li>
            <li>{grossFt2() - clearProgramFt2()} ft² zone area, derived</li>
          </ul>
          <button className="min-h-11 bg-primary px-4 text-primary-foreground" type="button" onClick={() => setProject(transformReference(project))}>
            Create the 3×3 reference house
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-widest text-primary">FUTURE · {project.provenance.profile}</p>
            <h1 className="text-xl leading-tight">Reference house</h1>
          </div>
          <p className="text-right font-mono text-xs text-muted-foreground">
            {shellFt()} ft shell
            <br />
            {hash.slice(0, 12)}
          </p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Clear {clearProgramFt2()} ft² derived · Gross {grossFt2()} ft² derived · Zone {grossFt2() - clearProgramFt2()} ft² derived · {project.authority.plan}
        </p>
        <nav className="mt-3 flex gap-2 overflow-x-auto">
          {(["Plan", "Design", "Systems", "Simulate", "Review", "Replay"] as View[]).map((item) => (
            <button key={item} type="button" className={`min-h-11 shrink-0 px-3 text-sm ${view === item ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`} onClick={() => setView(item)}>
              {item}
            </button>
          ))}
        </nav>
      </header>

      {view === "Plan" || view === "Design" ? (
        <section className="xl:grid xl:grid-cols-[16rem_minmax(0,1fr)_18rem]">
          <div className="hidden border-r border-border xl:block">
            <Tree tool={tool} onArm={() => { setTool(armTool(tool, SOFA.asset_id)); setNotice("Sofa armed. Tap a room once."); }} />
          </div>
          <div className="px-4 py-4">
            <div className="mb-3 flex gap-2 xl:hidden">
              <button className="min-h-11 flex-1 bg-card" type="button" onClick={() => setTreeOpen(true)}>Vision Tree</button>
              <button className="min-h-11 flex-1 bg-card" type="button" onClick={() => setActiveOpen(true)}>Active Elements</button>
            </div>
            <div className="mb-3 flex gap-2">
              {(["Plan", "3D", "Walk"] as Projection[]).map((item) => (
                <button key={item} type="button" className={`min-h-11 flex-1 ${projection === item ? "bg-primary text-primary-foreground" : "bg-card"}`} onClick={() => setProjection(item)}>
                  {item}
                </button>
              ))}
            </div>
            {tool.armed ? <p className="mb-2 text-sm text-primary">Armed: Sofa. Tap a room once.</p> : null}
            {projection === "Plan" ? (
              <PlanCanvas
                spaces={project.spaces}
                assets={project.assets}
                bearing={bearing}
                dragX={dragX}
                selected={selected}
                onRoom={onRoom}
                onDragStart={setDragX}
                onOrbit={(delta) => setBearing(delta)}
                onDragEnd={() => setDragX(null)}
              />
            ) : null}
            {projection === "3D" ? (
              <Projection3D
                spaces={project.spaces}
                assets={project.assets}
                bearing={bearing}
                dragX={dragX}
                onDragStart={setDragX}
                onOrbit={(delta) => setBearing(delta)}
                onDragEnd={() => setDragX(null)}
              />
            ) : null}
            {projection === "Walk" ? <WalkView space={selectedSpace} spaces={project.spaces} assets={project.assets} onPick={selectRoom} /> : null}
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              Changing the view does not change the project. Hash stays {hash.slice(0, 12)}.
            </p>
            {notice ? <p className="mt-2 text-sm">{notice}</p> : null}
          </div>
          <div className="hidden border-l border-border xl:block">
            <Active space={selectedSpace} assets={project.assets.filter((asset) => asset.space_id === selected)} onRotate={(id) => setProject(rotate(project, id))} />
          </div>
        </section>
      ) : null}

      {view === "Systems" ? (
        <section className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-4">
          <h2 className="text-lg">Construction method</h2>
          <div className="grid grid-cols-3 gap-2">
            {(["UNDECIDED", "FRAME", "PRINT"] as Method[]).map((item) => (
              <button key={item} type="button" className={`min-h-11 ${project.construction.method === item ? "bg-primary text-primary-foreground" : "bg-card"}`} onClick={() => setProject(setMethod(project, item))}>
                {item === "UNDECIDED" ? "Undecided" : item === "FRAME" ? "Frame" : "Print"}
              </button>
            ))}
          </div>
          <ul className="space-y-2 text-sm">
            {takeoff(project).length === 0 ? <li className="text-muted-foreground">Take-off not calculated until a method is chosen.</li> : null}
            {takeoff(project).map((line) => (
              <li key={line.item} className="border border-border bg-card p-3">
                <span className="font-medium">{line.item}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">{line.method} · {line.evidence}</span>
                <p className="mt-1 text-muted-foreground">{line.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {view === "Simulate" ? (
        <section className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-4 text-sm">
          <Domain title="Baseline build estimate" evidence={project.economics.baseline.total_evidence}>
            <p className="font-mono text-lg">{project.economics.baseline.total_usd.toLocaleString("en-US")} USD</p>
            <p className="text-muted-foreground">{project.economics.baseline.per_net_ft2} USD per net ft² · derived from the assumed baseline, not a market quote</p>
            <ul className="mt-2 space-y-1">
              {project.economics.baseline.sections.map((section) => (
                <li key={section.id} className="flex justify-between gap-3 font-mono text-xs">
                  <span>{section.name}</span>
                  <span>{section.usd.toLocaleString("en-US")} · {section.evidence}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 font-mono text-xs text-muted-foreground">MEP {mepRollup(project).usd.toLocaleString("en-US")} · {mepRollup(project).label}</p>
          </Domain>
          <Domain title="Labor" evidence={project.economics.labor.evidence}>
            <p>Not calculated. No accepted quote is on this project.</p>
          </Domain>
          <Domain title="Recognition" evidence={project.economics.recognition.evidence}>
            <p>Not calculated. Recognition is not part of the baseline.</p>
          </Domain>
          <Domain title="Local settlement" evidence={project.economics.settlement.evidence}>
            <label className="flex flex-col gap-1">
              Jurisdiction
              <select className="min-h-11 w-full border border-border bg-background px-2" value={project.economics.settlement.jurisdiction_id} onChange={(event) => setProject(setJurisdiction(project, event.target.value))}>
                <option value="US-TX">US-TX</option>
                <option value="NG">NG</option>
                <option value="BR">BR</option>
              </select>
            </label>
            <p className="text-muted-foreground">Changing jurisdiction does not change the baseline, labor, or recognition.</p>
          </Domain>
          {project.intent?.budget_intent ? (
            <Domain title="What you stated" evidence="USER_STATED">
              <p className="font-mono">{project.intent.budget_intent.amount_usd.toLocaleString("en-US")} USD</p>
              <p className="text-muted-foreground">This is your statement. It is not the baseline.</p>
            </Domain>
          ) : null}
        </section>
      ) : null}

      {view === "Review" ? (
        <section className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-4 text-sm">
          <p>Actor: unauthenticated human. Approval and qualification stay closed.</p>
          <button className="min-h-11 bg-primary text-primary-foreground" type="button" onClick={() => setProject(submit(project))}>Submit for review</button>
          <button
            className="min-h-11 bg-card text-muted-foreground"
            type="button"
            onClick={() => {
              const result = approve(project, DRAFT_ACTOR);
              setProject(result.project);
              setNotice(result.accepted ? "Approved." : "Not approved. An authenticated human is required, and submit is not approval.");
            }}
          >
            Approve
          </button>
          {notice ? <p>{notice}</p> : null}
          <ul className="space-y-2">
            {findings.map((finding) => (
              <li key={finding.id} className="border border-border p-3">
                <span className={finding.ok ? "text-foreground" : "text-primary"}>{finding.ok ? "Holds" : "Open"}</span>
                <p>{finding.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {view === "Replay" ? (
        <section className="mx-auto max-w-lg px-4 py-4 text-sm">
          <p className="font-mono text-xs text-muted-foreground">Live {hash.slice(0, 12)} · Replay {replayHash.slice(0, 12)} · {hash === replayHash ? "match" : "diverged"}</p>
          <ol className="mt-3 space-y-2">
            {project.events.map((event, index) => (
              <li key={`${event.event_type}-${index}`} className="border border-border bg-card p-3 font-mono text-xs">{index + 1}. {event.event_type}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {treeOpen ? (
        <Drawer title="Vision Tree" onClose={() => setTreeOpen(false)}>
          <Tree tool={tool} onArm={() => { setTool(armTool(tool, SOFA.asset_id)); setTreeOpen(false); setNotice("Sofa armed. Tap a room once."); }} />
        </Drawer>
      ) : null}
      {activeOpen ? (
        <Drawer title="Active Elements" onClose={() => setActiveOpen(false)}>
          <Active space={selectedSpace} assets={project.assets.filter((asset) => asset.space_id === selected)} onRotate={(id) => setProject(rotate(project, id))} />
        </Drawer>
      ) : null}
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1 text-sm">{label}{children}</label>;
}

function Domain({ title, evidence, children }: { title: string; evidence: string; children: ReactNode }) {
  return (
    <section className="border border-border bg-card p-3">
      <h2 className="text-base">{title}</h2>
      <p className="font-mono text-xs text-primary">{evidence}</p>
      <div className="mt-2 space-y-1">{children}</div>
    </section>
  );
}

function Tree({ tool, onArm }: { tool: ArmState; onArm: () => void }) {
  return (
    <div className="p-3 text-sm">
      <h2 className="mb-2 text-xs tracking-widest text-muted-foreground">VISION TREE</h2>
      <ul className="space-y-2">
        {VISION_GROUPS.map((group) => (
          <li key={group}>
            <p>{group}</p>
            {group === "Furniture" ? (
              <button type="button" className={`mt-1 min-h-11 w-full px-2 text-left ${tool.armed ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={onArm}>
                Sofa
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Active({ space, assets, onRotate }: { space: SpaceEntityV2 | null; assets: FutureProject["assets"]; onRotate: (id: string) => void }) {
  if (!space) return <p className="p-3 text-sm text-muted-foreground">Tap a room. Nothing you tap is saved unless a tool is armed.</p>;
  return (
    <div className="space-y-2 p-3 text-sm">
      <h2 className="text-xs tracking-widest text-muted-foreground">ACTIVE ELEMENTS</h2>
      <p className="text-lg">{space.name}</p>
      <p className="font-mono text-xs text-muted-foreground">{space.bay_code} · {space.fn} · {space.wet}</p>
      <p className="font-mono text-xs">Outer {ft(space.outer_width_um)} ft · Clear {ft(space.clear_width_um)} ft · Zone {ft(space.wall_zone_thickness_um)} ft</p>
      {assets.map((asset) => (
        <div key={asset.instance_id} className="border border-border p-2">
          <p>{asset.name} · {asset.instance_id}</p>
          <p className="font-mono text-xs text-muted-foreground">{asset.rotation_deg}° · {asset.authority}</p>
          <button type="button" className="mt-2 min-h-11 bg-card px-3" onClick={() => onRotate(asset.instance_id)}>
            Rotate
          </button>
        </div>
      ))}
    </div>
  );
}

function rowsOf(spaces: SpaceEntityV2[]) {
  return [2, 1, 0].flatMap((row) => spaces.filter((space) => Math.round(space.outer_y_um / space.outer_depth_um) === row));
}

function PlanCanvas({
  spaces, assets, bearing, dragX, selected, onRoom, onDragStart, onOrbit, onDragEnd,
}: {
  spaces: SpaceEntityV2[];
  assets: FutureProject["assets"];
  bearing: number;
  dragX: number | null;
  selected: string | null;
  onRoom: (space: SpaceEntityV2) => void;
  onDragStart: (x: number) => void;
  onOrbit: (delta: number) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      className="touch-none border border-border bg-card p-3"
      onPointerDown={(event) => onDragStart(event.clientX)}
      onPointerMove={(event) => { if (dragX !== null) onOrbit(event.clientX - dragX); }}
      onPointerUp={onDragEnd}
    >
      <p className="mb-2 font-mono text-xs text-muted-foreground">View bearing {bearing}°. Not saved.</p>
      <div className="grid grid-cols-3 gap-2">
        {rowsOf(spaces).map((space) => (
          <button key={space.entity_id} type="button" className={`min-h-24 border bg-background p-2 text-left ${selected === space.entity_id ? "border-primary" : "border-border"}`} onClick={(event) => { event.stopPropagation(); onRoom(space); }}>
            <span className="block text-sm">{space.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{space.bay_code} · {space.wet}</span>
            {assets.filter((asset) => asset.space_id === space.entity_id).map((asset) => (
              <span key={asset.instance_id} className="mt-2 block font-mono text-xs text-primary">{asset.name} · {asset.instance_id}</span>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}

function Projection3D({
  spaces, assets, bearing, dragX, onDragStart, onOrbit, onDragEnd,
}: {
  spaces: SpaceEntityV2[];
  assets: FutureProject["assets"];
  bearing: number;
  dragX: number | null;
  onDragStart: (x: number) => void;
  onOrbit: (delta: number) => void;
  onDragEnd: () => void;
}) {
  const turn = (bearing * Math.PI) / 180;
  return (
    <div
      className="relative h-80 touch-none overflow-hidden border border-border bg-card"
      onPointerDown={(event) => onDragStart(event.clientX)}
      onPointerMove={(event) => { if (dragX !== null) onOrbit(event.clientX - dragX); }}
      onPointerUp={onDragEnd}
    >
      <p className="absolute left-3 top-3 font-mono text-xs text-muted-foreground">One finger orbits. Bearing {bearing}°. Not saved.</p>
      {spaces.map((space) => {
        const col = space.outer_x_um / space.outer_width_um - 1;
        const row = space.outer_y_um / space.outer_depth_um - 1;
        const x = col * Math.cos(turn) - row * Math.sin(turn);
        const y = col * Math.sin(turn) + row * Math.cos(turn);
        const here = assets.filter((asset) => asset.space_id === space.entity_id);
        return (
          <div
            key={space.entity_id}
            className="absolute w-20 border border-primary bg-background p-1 text-center"
            style={{ left: `calc(50% + ${x * 78}px)`, top: `calc(42% + ${y * 46}px)`, transform: "translate(-50%, -50%)" }}
          >
            <p className="text-xs">{space.name}</p>
            {here.map((asset) => (
              <p key={asset.instance_id} className="font-mono text-xs text-primary">{asset.instance_id}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function WalkView({ space, spaces, assets, onPick }: { space: SpaceEntityV2 | null; spaces: SpaceEntityV2[]; assets: FutureProject["assets"]; onPick: (space: SpaceEntityV2) => void }) {
  const here = space ? assets.filter((asset) => asset.space_id === space.entity_id) : [];
  return (
    <div className="border border-border bg-card">
      <div className="flex h-64 flex-col items-center justify-end border-b border-border bg-background p-4">
        <p className="mb-6 text-sm text-muted-foreground">{space ? `${space.bay_code} · clear ${ft(space.clear_width_um)} ft` : "Choose a room"}</p>
        {here.length === 0 ? <p className="text-muted-foreground">Nothing saved in this room.</p> : null}
        {here.map((asset) => (
          <div key={asset.instance_id} className="mb-2 w-40 border border-primary bg-card p-3 text-center" style={{ transform: `rotate(${asset.rotation_deg}deg)` }}>
            <p>{asset.name}</p>
            <p className="font-mono text-xs text-primary">{asset.instance_id}</p>
          </div>
        ))}
        <p className="mt-4 text-lg">{space ? space.name : "Walk"}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        {rowsOf(spaces).map((room) => (
          <button key={room.entity_id} type="button" className={`min-h-11 text-sm ${space?.entity_id === room.entity_id ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => onPick(room)}>{room.name}</button>
        ))}
      </div>
    </div>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-20 bg-background">
      <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto border-t border-border bg-card">
        <div className="flex items-center justify-between px-3 py-2">
          <h2>{title}</h2>
          <button type="button" className="min-h-11 min-w-11" onClick={onClose} aria-label="Close">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
