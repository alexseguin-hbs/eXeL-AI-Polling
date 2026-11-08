// ARCHITECT-2525 / FUTURE · simulation/compare — benchmarks as SEPARATE axes (plan §19, FCRS-28). STUB (Phase 0).
import { notImplemented } from "../_notimpl";

export interface Benchmark {
  id: string;
  label: string;
  value: number;
  unit: string;   // distinct axis: $/wall ft² vs total USD vs $/net floor ft²
  note: string;
}

export function benchmarks(): Benchmark[] {
  return notImplemented("benchmarks", 4);
}
