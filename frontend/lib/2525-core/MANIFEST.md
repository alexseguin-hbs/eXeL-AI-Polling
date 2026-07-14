# 2525-Core — Vision 2525 Shared Core (Manifest)

**Principle:** Architect-2525 is the *first consumer, not the owner*. Reusable capabilities are promoted here
so future domains (Security · Health · Education · Logistics · Manta · Drone · Atlantis) inherit one
implementation instead of duplicating it. Import from `@/lib/2525-core`.

## Extracted (live in this session)
| Module | Source | What it is | Consumers |
|---|---|---|---|
| **Economy** | `components/architect-2525/architect-economy` | $/min · Trinity mint (♡ 웃 ◬) · Time Capital | Architect (COST·TIME, SoI) |
| **Estimate/Qualification** | `lib/architect-estimate` | AACE Class 5→1 · G0–G13 gates · cone bands · 4D schedule · Human Authority checkpoints | Architect (Build → Estimate/Forecast) |
| **SoI Framework** | `lib/soi-framework` | editable Tri-Coin schema · draft→published store · storage-event flow-through | Architect (SoI panel) + /main dashboard (SoISection) |
| **Expander** | `components/2525-core/expander` | theme-agnostic collapsible ("start minimized, expand on demand") | Architect (Overview cleanup) |

## Candidates to extract next (identified, not yet moved)
- **Replay engine / timeline** — universal replay (Security-2525 owns a version today).
- **Celestial** — `sunPos` / `moonSky` (in `architect-skysun`) → a pure `2525-core/celestial`.
- **GeoLabel** — the grey map-label law (in `security-2525/mission-planning`) → shared map primitive.
- **R-CORE lanes**, **FPS governor/meter**, **command palette / ⌘K search**, **layer tree**, **right context panel**,
  **bottom drawer**, **Human Authority panel**, **Digital Twin viewer**, **workspace presets**, **Knowledge Graph**.

## Rules
- Core modules stay **pure / theme-agnostic** (colours + labels via props/args; no domain vocabulary).
- A domain *specializes* by binding props (e.g. Architect binds `Expander` colours + `arch2525.exp` storage prefix).
- Never fork a core module into a domain; extend the core and pass options.
