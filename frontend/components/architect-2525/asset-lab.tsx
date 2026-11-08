"use client";
/**
 * ARCHITECT-2525 · 3D ASSET LAB (operator 2026-11-08: "I also need some element when selecting asset to rotate like the
 * two files" · "I want to see the sexy cyan violet recreations that give design life for a level 1 version").
 *
 * This IS the operator's own rotator, brought into the app: pick a pack → pick an asset → drag to spin, lit in his
 * cyan/violet scheme (the EXACT lights from his ALL_ASSETS_3D_Rotator). It loads the real 139-GLB library from
 * public/architect-2525/assets (one catalog.json + one GLB per selection) — never base64, never a remodel. three.js
 * is imported ONLY here (a leaf client component mounted via next/dynamic ssr:false), so it never enters the SVG
 * walk / plan / voxel bundle. Level-1 fidelity: the GLB's own box-composed geometry, his lights give it design life.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type AssetRow = { id: string; label: string; model: string; thumb: string | null; w: number | null; d: number | null; h: number | null };
type Section = { title: string; assets: AssetRow[] };
type Pack = { n: number; title: string; sections: Section[] };
type Catalog = { version: string; count: number; packs: Pack[] };

const CY = "#16e5e8", VIO = "#b65cff";

export default function AssetLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const placementRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ctrlRef = useRef<OrbitControls | null>(null);
  const loaderRef = useRef<GLTFLoader | null>(null);
  const reqRef = useRef(0); // guards against out-of-order async loads

  const [cat, setCat] = useState<Catalog | null>(null);
  const [packN, setPackN] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [rot, setRot] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 1) fetch the catalog
  useEffect(() => {
    let alive = true;
    fetch("/architect-2525/catalog.json")
      .then((r) => r.json())
      .then((c: Catalog) => { if (!alive) return; setCat(c); const firstReal = c.packs.find((p) => p.n > 0) ?? c.packs[0]; setPackN(firstReal?.n ?? null); })
      .catch(() => alive && setErr("Could not load the asset catalog."));
    return () => { alive = false; };
  }, []);

  // 2) one-time three.js scene (his cyan/violet rig)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030b12);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    camera.position.set(3.4, 2.4, 4.2);
    camRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.6, 0);
    ctrlRef.current = controls;

    // THE cyan/violet "design life" lighting — the operator's exact rig from ALL_ASSETS_3D_Rotator.
    scene.add(new THREE.HemisphereLight(0xdffcff, 0x16252d, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(4, 6, 5); scene.add(key);
    const cyan = new THREE.DirectionalLight(0x00edf0, 1.8); cyan.position.set(-4, 3, -3); scene.add(cyan);
    const vio = new THREE.DirectionalLight(0xb45cff, 1.3); vio.position.set(3, 2, -4); scene.add(vio);

    const grid = new THREE.GridHelper(12, 24, 0x16d9de, 0x173646);
    (grid.material as THREE.Material).opacity = 0.35; (grid.material as THREE.Material).transparent = true;
    scene.add(grid);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: 0x06131d, roughness: 0.95, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.004; scene.add(floor);

    loaderRef.current = new GLTFLoader();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width)), h = Math.max(1, Math.floor(r.height));
      if (canvas.width !== w || canvas.height !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

    return () => { ro.disconnect(); renderer.setAnimationLoop(null); controls.dispose(); renderer.dispose(); sceneRef.current = null; };
  }, []);

  // 3) load the selected asset's GLB (real file, his Z-up→Y-up + fit-to-floor)
  useEffect(() => {
    const scene = sceneRef.current, loader = loaderRef.current;
    if (!scene || !loader || !activeId || !cat) return;
    const row = cat.packs.flatMap((p) => p.sections).flatMap((s) => s.assets).find((a) => a.id === activeId);
    if (!row) return;
    const myReq = ++reqRef.current;
    setLoading(true); setErr(null);
    loader.loadAsync(row.model).then((gltf) => {
      if (myReq !== reqRef.current) return; // a newer selection won
      if (placementRef.current) { scene.remove(placementRef.current); placementRef.current = null; }
      const model = gltf.scene;
      model.rotation.x = -Math.PI / 2; // package is Z-up → three.js Y-up, once at intake
      const placement = new THREE.Group(); placement.add(model); scene.add(placement);
      placement.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(placement);
      const center = box.getCenter(new THREE.Vector3());
      placement.position.x -= center.x; placement.position.z -= center.z; placement.position.y -= box.min.y;
      placement.rotation.y = THREE.MathUtils.degToRad(rot);
      placementRef.current = placement;
      setLoading(false);
    }).catch(() => { if (myReq === reqRef.current) { setErr("Could not load this asset's 3D model."); setLoading(false); } });
  }, [activeId, cat]); // eslint-disable-line react-hooks/exhaustive-deps

  // live rotation slider
  useEffect(() => { if (placementRef.current) placementRef.current.rotation.y = THREE.MathUtils.degToRad(rot); }, [rot]);

  // default selection: first asset of the first real pack
  useEffect(() => {
    if (!cat || packN == null || activeId) return;
    const p = cat.packs.find((x) => x.n === packN);
    const first = p?.sections[0]?.assets[0];
    if (first) setActiveId(first.id);
  }, [cat, packN, activeId]);

  const pack = cat?.packs.find((p) => p.n === packN) ?? null;
  const rows: { section: string; a: AssetRow }[] = pack
    ? pack.sections.flatMap((s) => s.assets.filter((a) => a.label.toLowerCase().includes(query.trim().toLowerCase())).map((a) => ({ section: s.title, a })))
    : [];
  const active = cat?.packs.flatMap((p) => p.sections).flatMap((s) => s.assets).find((a) => a.id === activeId) ?? null;

  const resetView = () => {
    setRot(0);
    const cam = camRef.current, ctrl = ctrlRef.current;
    if (cam && ctrl) { cam.position.set(3.4, 2.4, 4.2); ctrl.target.set(0, 0.6, 0); ctrl.update(); }
  };

  const dim = (v: number | null) => (v == null ? "—" : `${v.toFixed(2)} m`);

  return (
    <div style={{ color: "var(--al-text)", background: "var(--al-bg)", minHeight: "100%" }}>
      <style>{`
        .al-wrap{--al-bg:#04101a;--al-panel:#081b29;--al-line:#174b61;--al-cy:${CY};--al-vio:${VIO};--al-text:#eef9fa;--al-muted:#89a8b6;--al-ok:#61f2a6;max-width:1180px;margin:0 auto;padding:14px}
        .al-head{display:flex;justify-content:space-between;align-items:end;gap:10px;flex-wrap:wrap;margin-bottom:10px}
        .al-brand{font-size:20px;font-weight:800;color:var(--al-text)}.al-brand b{color:var(--al-cy)}.al-brand i{color:var(--al-vio);font-style:normal}
        .al-sub{color:var(--al-muted);font-size:12px}
        .al-grid{display:grid;grid-template-columns:300px minmax(0,1fr);gap:10px}
        @media(max-width:820px){.al-grid{grid-template-columns:1fr}}
        .al-panel{background:linear-gradient(#081b29,#04101a);border:1px solid var(--al-line);border-radius:13px;overflow:hidden}
        .al-ph{padding:9px 11px;border-bottom:1px solid var(--al-line);display:flex;justify-content:space-between;gap:8px;align-items:center}
        .al-ph b{color:var(--al-cy);font-size:13px}.al-ph span{color:var(--al-muted);font-size:10px}
        .al-sel{padding:10px 11px;display:flex;flex-direction:column;gap:8px}
        .al-sel label{color:var(--al-muted);font-size:11px;display:block;margin-bottom:3px}
        select,input[type=search]{width:100%;background:#061522;color:var(--al-text);border:1px solid var(--al-line);border-radius:9px;padding:9px;font:13px/1.2 inherit}
        .al-list{max-height:280px;overflow:auto;padding:4px 8px 10px}
        @media(max-width:820px){.al-list{max-height:200px}}
        .al-sech{color:var(--al-vio);font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin:8px 2px 3px;font-weight:700}
        .al-asset{display:flex;justify-content:space-between;gap:6px;width:100%;text-align:left;background:#061522;border:1px solid var(--al-line);border-radius:8px;padding:8px 9px;margin:3px 0;color:var(--al-text);cursor:pointer;font-size:12.5px}
        .al-asset:hover{border-color:var(--al-cy)}
        .al-asset.sel{border-color:var(--al-cy);background:#0a2535;color:var(--al-cy);font-weight:600}
        .al-viewer{position:relative;min-height:460px;background:#030b12;border:1px solid var(--al-line);border-radius:13px;overflow:hidden}
        .al-canvas{display:block;width:100%;height:520px;touch-action:none}
        @media(max-width:820px){.al-canvas{height:380px}.al-viewer{min-height:380px}}
        .al-hud{position:absolute;top:10px;left:10px;display:flex;gap:6px;flex-wrap:wrap;z-index:2}
        .al-pill{background:rgba(4,13,21,.86);border:1px solid #26576b;border-radius:999px;padding:6px 9px;font-size:10px;color:var(--al-cy)}
        .al-pill.vio{color:var(--al-vio);border-color:#4a2e6b}
        .al-ctrls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:9px}
        @media(max-width:560px){.al-ctrls{grid-template-columns:1fr 1fr}}
        .al-card{border:1px solid var(--al-line);background:var(--al-panel);border-radius:11px;padding:10px}
        .al-card label{color:var(--al-muted);font-size:11px;display:block;margin-bottom:6px}
        .al-val{color:var(--al-cy);font-variant-numeric:tabular-nums}
        input[type=range]{width:100%;accent-color:${CY}}
        button.al-btn{width:100%;min-height:42px;border-radius:10px;border:1px solid var(--al-line);background:#0a1b26;color:var(--al-text);cursor:pointer;font-weight:600}
        button.al-btn:hover{border-color:var(--al-cy)}
        .al-meta{display:flex;gap:10px;flex-wrap:wrap;color:var(--al-muted);font-size:11px;margin-top:8px}
        .al-meta b{color:var(--al-text)}
        .al-note{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--al-muted);font-size:13px;pointer-events:none}
      `}</style>
      <div className="al-wrap">
        <div className="al-head">
          <div>
            <div className="al-brand"><b>eXeL</b> AI · <i>Architect-2525</i> · 3D Asset Lab</div>
            <div className="al-sub">Pick a pack → pick an asset → drag to spin. The real {cat?.count ?? 139}-asset library, lit cyan/violet · Level 1 wireframe.</div>
          </div>
          <div className="al-sub">{active ? <>Asset ID: <span className="al-val">{active.id}</span></> : "Loading…"}</div>
        </div>

        <div className="al-grid">
          <div className="al-panel">
            <div className="al-ph"><b>LIBRARY</b><span>{pack ? `${rows.length} shown` : ""}</span></div>
            <div className="al-sel">
              <div>
                <label>1 · Select Pack</label>
                <select value={packN ?? ""} onChange={(e) => { setPackN(Number(e.target.value)); setActiveId(""); }} data-al-pack>
                  {cat?.packs.map((p) => <option key={p.n} value={p.n}>{p.n > 0 ? `Pack ${p.n} — ${p.title}` : p.title}</option>)}
                </select>
              </div>
              <div>
                <label>2 · Select Asset</label>
                <select value={activeId} onChange={(e) => setActiveId(e.target.value)} data-al-asset>
                  {pack?.sections.flatMap((s) => s.assets).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <input type="search" placeholder="Search assets…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="al-list">
              {pack?.sections.map((s) => {
                const items = s.assets.filter((a) => a.label.toLowerCase().includes(query.trim().toLowerCase()));
                if (!items.length) return null;
                return (
                  <div key={s.title}>
                    <div className="al-sech">{s.title}</div>
                    {items.map((a) => (
                      <button key={a.id} className={`al-asset${a.id === activeId ? " sel" : ""}`} onClick={() => setActiveId(a.id)} data-al-asset-btn={a.id}>
                        <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="al-viewer">
              <div className="al-hud">
                <span className="al-pill">GLB · 3D · ROTATABLE</span>
                <span className="al-pill vio">{active?.label ?? ""}</span>
              </div>
              <canvas ref={canvasRef} className="al-canvas" data-al-canvas />
              {loading && <div className="al-note">Loading 3D model…</div>}
              {err && <div className="al-note" style={{ color: VIO }}>{err}</div>}
            </div>

            <div className="al-ctrls">
              <div className="al-card">
                <label>Spin <span className="al-val">{rot}°</span></label>
                <input type="range" min={0} max={360} step={1} value={rot} onChange={(e) => setRot(Number(e.target.value))} data-al-spin />
              </div>
              <div className="al-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <label>Dimensions</label>
                <div style={{ fontSize: 12 }}>
                  <span className="al-val">{dim(active?.w ?? null)}</span> W · <span className="al-val">{dim(active?.d ?? null)}</span> D · <span className="al-val">{dim(active?.h ?? null)}</span> H
                </div>
              </div>
              <div className="al-card" style={{ display: "flex", alignItems: "center" }}>
                <button className="al-btn" onClick={resetView} data-al-reset>Reset view</button>
              </div>
            </div>

            <div className="al-meta">
              <span>Library: <b>{cat?.count ?? "…"}</b> assets</span>
              <span>Drag to orbit · wheel / pinch to zoom · slider to spin</span>
              <span>Illustrative (Level 1) — does not change the canonical project</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
