"use client";

/**
 * ARCHITECT-2525 · DESIGN FILES — export/import the custom .arch2525 project file (all elements) + a named
 * "Saved Designs" library, the way Mission-Planning saves missions. Access mirrors the Security-2525 AO/MISSION
 * dropdown (IMG_7592): a single collapsed pill (name + chevron) opens a floating panel with a "＋ New Design"
 * row (name → Save · Export .arch2525 · Upload) and the saved-designs list (Load / Download / Delete). Declutters
 * the surface — the list never takes the full panel until the operator opens it. All state assembly + seating is
 * owned by command-ux1 (which has the full layer snapshot + homeType + room layout); this is only the UI.
 */
import { useEffect, useRef, useState } from "react";
import { Download, Upload, Save, FolderOpen, Trash2, ChevronRight } from "lucide-react";
import { type ArchitectProjectFile, toFileText, parseProject, projectFilename, ARCH_FILE_EXT } from "@/lib/architect-project-file";

const C = { border: "#1e2b3a", panel: "#0c1420", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", red: "#f87171" };
const LIB_KEY = "arch2525.savedDesigns";

interface SavedEntry { name: string; savedAt: number; file: ArchitectProjectFile }

function readLib(): SavedEntry[] {
  try { const v = localStorage.getItem(LIB_KEY); const a = v ? JSON.parse(v) : []; return Array.isArray(a) ? a : []; } catch { return []; }
}
function writeLib(list: SavedEntry[]) { try { localStorage.setItem(LIB_KEY, JSON.stringify(list.slice(0, 30))); } catch {} }

export function ArchitectProjects({ buildFile, onLoad }: {
  buildFile: (name: string) => ArchitectProjectFile;      // command-ux1 assembles the full .arch2525 from live state
  onLoad: (file: ArchitectProjectFile) => void;           // command-ux1 seats snapshot + rooms + market
}) {
  const [name, setName] = useState("");
  const [lib, setLib] = useState<SavedEntry[]>(() => readLib());
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);                // MP-style declutter — list lives behind the pill
  const fileRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const note = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2600); };

  // Click-away closes the dropdown, like the Security AO/MISSION menu.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const saveNamed = () => {
    const nm = name.trim() || "Untitled Design";
    const file = buildFile(nm);
    const next = [{ name: nm, savedAt: file.savedAt, file }, ...lib.filter((e) => e.name !== nm)];
    writeLib(next); setLib(next); setName(""); note(`Saved “${nm}”`);
  };
  const download = (file: ArchitectProjectFile) => {
    const blob = new Blob([toFileText(file)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = projectFilename(file.name); a.click(); URL.revokeObjectURL(url);
  };
  const exportCurrent = () => download(buildFile(name.trim() || "Untitled Design"));
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const file = parseProject(String(reader.result));
      if (!file) { note("Not a valid .arch2525 file"); return; }
      onLoad(file);
      const next = [{ name: file.name, savedAt: file.savedAt, file }, ...lib.filter((x) => x.name !== file.name)];
      writeLib(next); setLib(next); note(`Loaded “${file.name}”`);
    };
    reader.onerror = () => note("Couldn’t read that file");
    reader.readAsText(f);
    e.target.value = ""; // allow re-selecting the same file
  };
  const remove = (nm: string) => { const next = lib.filter((e) => e.name !== nm); writeLib(next); setLib(next); };

  const btn = "flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold";
  return (
    <div ref={wrapRef} data-arch-projects className="relative flex flex-col gap-1 text-[11px]" style={{ color: C.text }}>
      {/* Collapsed pill — same declutter method as Security-2525's AO/MISSION dropdown */}
      <button data-arch-proj-menu onClick={() => setOpen((v) => !v)} title="Saved designs — save · load · export .arch2525"
        className="flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold tracking-wide"
        style={{ borderColor: open ? C.cyan : C.border, color: C.cyan }}>
        <FolderOpen className="h-3 w-3" /> Saved Designs · {lib.length}
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} style={{ color: C.dim }} />
      </button>

      {open && (
        <div data-arch-proj-panel className="absolute left-0 top-8 z-50 flex max-h-[70vh] w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 overflow-y-auto rounded-lg border p-2 shadow-2xl"
          style={{ background: C.panel, borderColor: C.cyan }}>
          {/* ＋ New Design — mirrors Security's "＋ NEW MISSION" row at the head of the menu */}
          <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: C.gold }}>＋ New Design</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <input data-arch-proj-name value={name} onChange={(e) => setName(e.target.value)} placeholder="Design name…"
              className="min-w-0 flex-1 rounded border bg-transparent px-2 py-1" style={{ borderColor: C.border, color: C.text, fontSize: 16 }} />
            <button data-arch-proj-save onClick={saveNamed} className={btn} style={{ borderColor: C.cyan, color: C.cyan }}><Save className="h-3 w-3" /> Save</button>
            <button data-arch-proj-export onClick={exportCurrent} className={btn} style={{ borderColor: C.violet, color: C.violet }}><Download className="h-3 w-3" /> .{ARCH_FILE_EXT}</button>
            <button data-arch-proj-import onClick={() => fileRef.current?.click()} className={btn} style={{ borderColor: C.border, color: C.text }}><Upload className="h-3 w-3" /> Upload</button>
            <input ref={fileRef} data-arch-proj-file type="file" accept={`.${ARCH_FILE_EXT},application/json,.json`} onChange={onFile} className="hidden" />
          </div>
          {msg && <div className="rounded px-2 py-0.5 text-[10px]" style={{ color: C.gold }}>{msg}</div>}

          <div className="border-t pt-1 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim, borderColor: C.border }}>Saved designs · {lib.length}</div>
          {lib.length === 0 ? (
            <div className="text-[10px]" style={{ color: C.dim }}>No saved designs yet — name one and tap Save, or Upload a .{ARCH_FILE_EXT} file.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {lib.map((e) => (
                <div key={e.name} data-arch-proj-row={e.name} className="flex items-center gap-1 rounded border px-2 py-1" style={{ borderColor: C.border, background: "#0a1018" }}>
                  <span className="min-w-0 flex-1 truncate font-semibold" style={{ color: C.text }}>{e.name}</span>
                  <button data-arch-proj-load={e.name} onClick={() => { onLoad(e.file); note(`Loaded “${e.name}”`); }} title="Load this design" className="rounded border p-1" style={{ borderColor: C.cyan, color: C.cyan }}><FolderOpen className="h-3 w-3" /></button>
                  <button data-arch-proj-dl={e.name} onClick={() => download(e.file)} title="Download .arch2525" className="rounded border p-1" style={{ borderColor: C.border, color: C.violet }}><Download className="h-3 w-3" /></button>
                  <button data-arch-proj-del={e.name} onClick={() => remove(e.name)} title="Delete" className="rounded border p-1" style={{ borderColor: C.border, color: C.red }}><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
