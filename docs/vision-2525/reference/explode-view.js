// explode-view.js — Cube 1 exploded view
//
// Fixes / adds, in order of what you asked for:
//   1. Blocks render as their REAL voxel shapes, not 2x1x1 columns. Each block
//      is a Group of unit cells built from a cell list, so an L stays an L.
//   2. 1.1 – 1.6 labels are billboard sprites that fade in as the view opens.
//   3. One slider drives everything: hard left = solid 3x3x3, hard right =
//      maximum spacing between blocks + camera dollied out + tilted up.
//
// Works with plain Three.js. For react-three-fiber, call createExplodeView()
// inside a useEffect and pass it your existing scene/camera instead of letting
// it build its own (see the options block).

import * as THREE from 'three';
import { assignCells } from './cube-partitions.js';

export const GRID = 3;                    // 3 x 3 x 3
const CENTER = (GRID - 1) / 2;            // 1.0 — center of the grid in cell coords

// ---------------------------------------------------------------------------
// BLOCK DEFINITIONS
// ---------------------------------------------------------------------------
// Only identity and color live here. Shapes come from cube-partitions.js, which
// guarantees the set tiles all 27 cells with connected pieces — so the slider's
// left end always reads as one solid cube, whatever the block count.
//
// To pin a block to a specific shape, add its own `cells: [[x,y,z], ...]`. If
// ANY block carries explicit cells, supply them for all of them — the two
// systems don't merge, and a partial set would leave holes.
//
// Colors are taken from your exploded-view screenshot.

export const BLOCKS = [
  { id: '1.1', fn: 'create_session',   color: 0x22d3ee },
  { id: '1.2', fn: '',                 color: 0xfbbf24 },
  { id: '1.3', fn: 'generate_qr',      color: 0xa78bfa },
  { id: '1.4', fn: '',                 color: 0x34d399 },
  { id: '1.5', fn: 'transition_state', color: 0xf87171 },
  { id: '1.6', fn: '',                 color: 0x60a5fa },
];

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------
const SPREAD        = 1.7;   // how far blocks push apart at full explode
const BASE_RADIUS   = 7.0;   // camera distance when assembled
const ZOOM_OUT      = 1.1;   // radius multiplier added at full explode (7 -> ~14.7)
const TILT_DEGREES  = 14;    // camera lifts this much as it opens. Set 0 to disable.
const DAMPING       = 0.12;  // 0..1 — lower is slower, more liquid
const CELL          = 1.0;   // unit cell edge length
const GAP           = 0.04;  // hairline gap between cells so faces read separately

// Dashed leader lines — CAD convention: each block trails a line back to the
// socket it came from, so the eye can reassemble the cube without the slider.
const LEADER_DASH   = 0.16;  // dash length in world units
const LEADER_GAP    = 0.11;  // gap between dashes
const LEADER_ALPHA  = 0.5;   // max opacity — stays under the block edges
const LEADER_TINT   = 0.55;  // 0 = white line, 1 = full block color

// ---------------------------------------------------------------------------

export function createExplodeView({
  mount,                       // DOM element to render into
  blocks = BLOCKS,
  config,                      // optional path name from cube-partitions PATHS
  scene: externalScene,        // pass these to reuse an existing r3f/three setup
  camera: externalCamera,
  renderer: externalRenderer,
  onChange,                    // (t) => void — fires as the slider moves
} = {}) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Blocks without explicit shapes get them from the partitioner. This throws
  // rather than renders if the result wouldn't tile all 27 cells.
  const blockDefs = blocks.every((b) => b.cells)
    ? blocks
    : assignCells(blocks, config);

  const scene = externalScene || new THREE.Scene();
  const camera = externalCamera || new THREE.PerspectiveCamera(
    42, mount.clientWidth / mount.clientHeight, 0.1, 100
  );
  const renderer = externalRenderer || new THREE.WebGLRenderer({
    antialias: true, alpha: true,
  });

  if (!externalRenderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
  }

  const target = new THREE.Vector3(0, 0, 0);
  const root = new THREE.Group();
  scene.add(root);

  if (!externalCamera) {
    camera.position.set(6, 4.5, 6);
    camera.lookAt(target);
  }

  // -- Build one Group per block, one mesh per cell --------------------------
  // This is the fix for the 2x1x1 problem: geometry comes from the cell list,
  // so a block's silhouette in the exploded view matches its assembled shape.

  const built = blockDefs.map((block, i) => {
    const group = new THREE.Group();

    // Centroid in grid coords, so we can position the group at the shape's
    // middle and lay cells out relative to it.
    const c = block.cells.reduce(
      (acc, [x, y, z]) => { acc.x += x; acc.y += y; acc.z += z; return acc; },
      { x: 0, y: 0, z: 0 }
    );
    const n = block.cells.length;
    const centroid = new THREE.Vector3(c.x / n, c.y / n, c.z / n);

    const fill = new THREE.MeshStandardMaterial({
      color: block.color,
      transparent: true,
      opacity: 0.42,
      roughness: 0.35,
      metalness: 0.1,
      depthWrite: false,
    });
    const edgeMat = new THREE.LineBasicMaterial({
      color: block.color, transparent: true, opacity: 0.9,
    });

    const boxGeo = new THREE.BoxGeometry(CELL - GAP, CELL - GAP, CELL - GAP);
    const edgeGeo = new THREE.EdgesGeometry(boxGeo);

    for (const [x, y, z] of block.cells) {
      const local = new THREE.Vector3(x, y, z).sub(centroid);
      const mesh = new THREE.Mesh(boxGeo, fill);
      mesh.position.copy(local);
      group.add(mesh);

      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(local);
      group.add(edges);
    }

    // Rest position: centroid relative to the middle of the grid.
    const rest = centroid.clone().sub(new THREE.Vector3(CENTER, CENTER, CENTER));

    // A block sitting near dead center has no outward direction of its own —
    // give it one from an evenly distributed sphere so it doesn't stay put.
    const golden = Math.PI * (3 - Math.sqrt(5));
    const yy = 1 - (i / Math.max(1, blockDefs.length - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - yy * yy));
    const fallback = new THREE.Vector3(
      Math.cos(golden * i) * r, yy, Math.sin(golden * i) * r
    );
    const dir = rest.length() < 0.35 ? fallback : rest.clone().normalize();

    group.position.copy(rest);
    root.add(group);

    const label = makeLabel(block, block.color);
    label.position.copy(rest);
    label.material.opacity = 0;
    label.visible = false;
    root.add(label);

    // Leader line: two points, home -> current. Rebuilt each frame.
    const leaderColor = new THREE.Color(0xffffff).lerp(
      new THREE.Color(block.color), LEADER_TINT
    );
    const leaderGeo = new THREE.BufferGeometry().setFromPoints([
      rest.clone(), rest.clone(),
    ]);
    const leader = new THREE.Line(
      leaderGeo,
      new THREE.LineDashedMaterial({
        color: leaderColor,
        dashSize: LEADER_DASH,
        gapSize: LEADER_GAP,
        transparent: true,
        opacity: 0,
        depthTest: false,
      })
    );
    leader.computeLineDistances();
    leader.renderOrder = 1;
    leader.visible = false;
    root.add(leader);

    return { block, group, label, leader, rest, dir, current: rest.clone() };
  });

  // -- Lighting (skip if you already light the scene) -------------------------
  if (!externalScene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const key = new THREE.DirectionalLight(0xff4fd8, 0.6);
    key.position.set(4, 6, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x22d3ee, 0.45);
    rim.position.set(-5, -2, -4);
    scene.add(rim);
  }

  // -- State ----------------------------------------------------------------
  let t = 0;              // slider value, 0 = assembled 3x3x3, 1 = fully open
  let shownT = 0;         // damped value actually rendered
  let radius = BASE_RADIUS;
  let running = true;

  function setExplode(next) {
    t = THREE.MathUtils.clamp(next, 0, 1);
    if (reduceMotion) shownT = t;   // no easing for users who asked for none
    onChange?.(t);
  }

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);

    shownT += (t - shownT) * (reduceMotion ? 1 : DAMPING);

    // Blocks: push outward along their own direction, scaled by spread.
    for (const b of built) {
      const goal = b.rest.clone().addScaledVector(b.dir, SPREAD * shownT * GRID * 0.5);
      b.group.position.copy(goal);
      b.label.position.copy(goal);

      // Labels appear once there's room for them to be read.
      const o = THREE.MathUtils.smoothstep(shownT, 0.06, 0.30);
      b.label.material.opacity = o;
      b.label.visible = o > 0.01;

      // Leader line: home -> current. Fades in earlier than the labels so the
      // separation reads as deliberate from the first few percent of travel.
      const lp = b.leader.geometry.attributes.position;
      lp.setXYZ(0, b.rest.x, b.rest.y, b.rest.z);
      lp.setXYZ(1, goal.x, goal.y, goal.z);
      lp.needsUpdate = true;
      b.leader.geometry.computeBoundingSphere();
      b.leader.computeLineDistances();   // required after moving a dashed line

      const lo = THREE.MathUtils.smoothstep(shownT, 0.02, 0.18) * LEADER_ALPHA;
      b.leader.material.opacity = lo;
      b.leader.visible = lo > 0.01;
    }

    // Camera: keep whatever rotation the user dragged to, change only distance
    // and elevation. This plays nicely with OrbitControls if you have it.
    const goalRadius = BASE_RADIUS * (1 + ZOOM_OUT * shownT);
    radius += (goalRadius - radius) * (reduceMotion ? 1 : DAMPING);

    const offset = camera.position.clone().sub(target);
    const tilt = THREE.MathUtils.degToRad(TILT_DEGREES) * shownT;
    const horiz = Math.hypot(offset.x, offset.z) || 0.0001;
    const currentPitch = Math.atan2(offset.y, horiz);
    const pitch = THREE.MathUtils.clamp(currentPitch + tilt * 0.15, -1.2, 1.2);
    const yaw = Math.atan2(offset.z, offset.x);

    camera.position.set(
      target.x + Math.cos(pitch) * Math.cos(yaw) * radius,
      target.y + Math.sin(pitch) * radius,
      target.z + Math.cos(pitch) * Math.sin(yaw) * radius
    );
    camera.lookAt(target);

    renderer.render(scene, camera);
  }
  frame();

  function resize() {
    if (externalRenderer) return;
    const w = mount.clientWidth, h = mount.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  function dispose() {
    running = false;
    window.removeEventListener('resize', resize);
    root.traverse((o) => {
      o.geometry?.dispose?.();
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material?.dispose?.();
    });
    scene.remove(root);
    if (!externalRenderer) renderer.dispose();
  }

  return { setExplode, dispose, scene, camera, renderer, blocks: built };
}

// ---------------------------------------------------------------------------
// Billboard label — a Sprite, so it always faces the camera at any rotation.
// ---------------------------------------------------------------------------
function makeLabel({ id, fn }, color) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 224;
  const g = c.getContext('2d');
  const hex = '#' + color.toString(16).padStart(6, '0');

  g.clearRect(0, 0, c.width, c.height);

  // Chip behind the text so it stays legible over any block color.
  g.fillStyle = 'rgba(10, 2, 18, 0.82)';
  roundRect(g, 8, 8, c.width - 16, c.height - 16, 28);
  g.fill();
  g.strokeStyle = hex;
  g.lineWidth = 4;
  roundRect(g, 8, 8, c.width - 16, c.height - 16, 28);
  g.stroke();

  g.textAlign = 'center';
  g.fillStyle = hex;
  g.font = 'bold 104px ui-monospace, "SF Mono", Menlo, monospace';
  g.fillText(id, c.width / 2, fn ? 108 : 138);

  if (fn) {
    g.fillStyle = 'rgba(255,255,255,0.78)';
    g.font = '46px ui-monospace, "SF Mono", Menlo, monospace';
    g.fillText(fn, c.width / 2, 172);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  );
  sprite.scale.set(1.55, 0.68, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
