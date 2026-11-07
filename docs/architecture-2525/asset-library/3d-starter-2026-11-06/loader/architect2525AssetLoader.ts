import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type ArchitectAssetMeta = {
  id: string;
  label: string;
  category: string;
  model: string;
  dimensionsM: { width: number; depth: number; height: number };
  pivot: { origin: "FLOOR_CENTER"; axes: string };
  rotation: { axis: "Z"; allowedDegrees: number[]; freeRotation: boolean };
  mounting: "FLOOR" | "WALL" | "CEILING" | "SURFACE" | "BUILT_IN";
  snap: string[];
  authority: "ILLUSTRATIVE" | "REFERENCE" | "CANONICAL";
  rooms: string[];
  phaseCompatibility: string[];
};

const loader = new GLTFLoader();

export async function loadArchitectAsset(modelUrl: string): Promise<THREE.Group> {
  const gltf = await loader.loadAsync(modelUrl);
  const root = gltf.scene;
  root.updateMatrixWorld(true);

  // Package convention: model pivot is floor-center and Z is up.
  // Three.js defaults to Y-up. Convert once at intake boundary.
  root.rotation.x = -Math.PI / 2;
  root.updateMatrixWorld(true);

  return root;
}

export function setArchitectAssetRotation(
  object: THREE.Object3D,
  degrees: number
) {
  // After Z-up -> Y-up intake conversion, user rotation is around world Y.
  object.rotation.y = THREE.MathUtils.degToRad(degrees);
}

export function placeArchitectAsset(
  object: THREE.Object3D,
  x: number,
  z: number,
  floorY = 0
) {
  object.position.set(x, floorY, z);
}

export function applyAssetMetadata(
  object: THREE.Object3D,
  meta: ArchitectAssetMeta
) {
  object.userData.architect2525 = {
    assetId: meta.id,
    authority: meta.authority,
    mounting: meta.mounting,
    snap: meta.snap,
    rooms: meta.rooms,
    phaseCompatibility: meta.phaseCompatibility
  };
}
