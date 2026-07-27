export const meta = {
  name: 'innovation-derisk-council',
  description: '12 Ascended Masters + MoT derisk review of the shipped Innovation Project, returning a ranked, verified apply-now / defer fix backlog',
  phases: [
    { title: 'Council', detail: '12 AsM each review the Innovation surfaces through their lens' },
    { title: 'Synthesis', detail: 'MoT ranks + verifies into an apply-now / defer backlog' },
  ],
}

const SURFACES = [
  'frontend/app/innovation/page.tsx (the UI — ~3600 lines; rack/stack, gates, slide show, budget, exec slide, constellation)',
  'frontend/lib/innovation-data.ts (pure model + calculators — GATE_REVIEW, GATE_NOTES, SLIDES, aiSlideOf, valueEquation, financialMetrics, hierarchy)',
  'frontend/lib/innovation-store.ts (Supabase persistence, localStorage write-through)',
  'frontend/lib/lexicon-data.ts (innovation.* i18n group, cubeId 60)',
  'supabase/migrations/028_innovation_state.sql (innovation_state table + RLS)',
]

const MASTERS = [
  { name: 'Thor',    lens: 'Risk & Security stress testing — RLS/ownerKey isolation, Supabase blob size/last-write-wins, input that could throw, secrets, XSS in rendered text.' },
  { name: 'Enlil',   lens: 'Implementation & build verification — determinism of calculators, never-throw guards (clamp/NaN), handoff readiness correctness, dead code.' },
  { name: 'Thoth',   lens: 'Data & analytics — financial math correctness (NPV/IRR/payback), Value Equation/EVC edges, rounding, division-by-zero, unit consistency ($K vs $M).' },
  { name: 'Sofia',   lens: 'Multi-perspective clarity — lexicon coverage (hardcoded English in the new panels), vocabulary consistency, label ambiguity across personas.' },
  { name: 'Athena',  lens: 'Strategic flow — does the value-prop → gates → budget → BD spine hold; navigation dead-ends; persona routing to the slide show.' },
  { name: 'Aset',    lens: 'Consistency & reinforcement — same metric/format shown identically across dog-tag, matrix, slide show, exec slide; slide status sync across surfaces.' },
  { name: 'Asar',    lens: 'Synthesis & outcome — do exports (BD packet, outcome brief) and the slide show reflect the same source of truth; missing-slide (AI-fill) correctness.' },
  { name: 'Krishna', lens: 'Integration & cross-module — store keys collide? SLIDE_KEY/SLIDE_HI_KEY/SIGNOFF shared correctly; GateCube vs GateRequirementsView state parity.' },
  { name: 'Odin',    lens: 'Predictive / future-proofing — what breaks at scale (100+ projects), stale Supabase blobs, migration-not-applied graceful degradation.' },
  { name: 'Enki',    lens: 'Diversity & edge cases — empty project, no drivers, no NBA, gate G7 (final), single-deliverable gates, RTL/long-string overflow.' },
  { name: 'Pangu',   lens: 'Cutting-edge / mobile-first — 375px overflow on the widened surfaces (budget popup, waterfall, slide strip, G1→G7 strip); touch targets; body horizontal scroll.' },
  { name: 'Christo', lens: 'Consensus & a11y/UX — aria-labels on new controls (toggles, sign-off chips, sliders, slide nav), keyboard focus, reduced-motion, contrast.' },
]

const FINDING_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['master', 'grade', 'summary', 'findings'],
  properties: {
    master: { type: 'string' },
    grade: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
    summary: { type: 'string', description: 'one-sentence overall read through this lens' },
    findings: {
      type: 'array', maxItems: 6,
      items: {
        type: 'object', additionalProperties: false,
        required: ['risk', 'severity', 'area', 'fix', 'safe'],
        properties: {
          risk: { type: 'string', description: 'the concrete defect/risk, with file + rough location' },
          severity: { type: 'string', enum: ['high', 'med', 'low'] },
          area: { type: 'string', description: 'file or component' },
          fix: { type: 'string', description: 'the specific, minimal fix' },
          safe: { type: 'boolean', description: 'true = additive, gated, no un-asked UI change, low-risk to apply now' },
        },
      },
    },
  },
}

const MOT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['direction', 'applyNow', 'defer', 'residualRisks', 'grades'],
  properties: {
    direction: { type: 'string', description: '2-3 sentence MoT direction to the team' },
    applyNow: {
      type: 'array', maxItems: 12,
      items: {
        type: 'object', additionalProperties: false,
        required: ['risk', 'area', 'fix', 'whySafe'],
        properties: { risk: { type: 'string' }, area: { type: 'string' }, fix: { type: 'string' }, whySafe: { type: 'string' } },
      },
    },
    defer: {
      type: 'array', maxItems: 10,
      items: { type: 'object', additionalProperties: false, required: ['risk', 'area', 'whyDefer'], properties: { risk: { type: 'string' }, area: { type: 'string' }, whyDefer: { type: 'string' } } },
    },
    residualRisks: {
      type: 'array', maxItems: 10,
      items: { type: 'object', additionalProperties: false, required: ['risk', 'severity'], properties: { risk: { type: 'string' }, severity: { type: 'string', enum: ['high', 'med', 'low'] } } },
    },
    grades: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['master', 'grade'], properties: { master: { type: 'string' }, grade: { type: 'string' } } },
    },
  },
}

phase('Council')
const reviews = await parallel(MASTERS.map((m) => () =>
  agent(
    `You are ${m.name}, an Ascended Master reviewing the eXeL-AI "Innovation Project" (Portfolio Prioritization tool, route /innovation) for DE-RISKING before it is relied on.\n\n` +
    `YOUR LENS: ${m.lens}\n\n` +
    `Review these real files (Read/Grep them — do not guess):\n${SURFACES.map((s) => '  - ' + s).join('\n')}\n\n` +
    `Focus especially on this session's additions: the digital slide show (SlideShowModal, aiSlideOf, SLIDE_HI_KEY/SLIDE_LENS_KEY), GATE_NOTES + GateNotesPanel, and the S1–S18 matrix render. ` +
    `Return ONLY real, specific findings you can point to a file/location for. Mark each finding safe:true ONLY if the fix is additive, gated, needs no un-asked UI change (CLAUDE.md rule 6), and is low-risk. Give an honest grade A–F for your lens.`,
    { label: `AsM:${m.name}`, phase: 'Council', schema: FINDING_SCHEMA, agentType: 'general-purpose' },
  ).then((r) => ({ ...r, master: m.name })),
))

const clean = reviews.filter(Boolean)
const allFindings = clean.flatMap((r) => (r.findings || []).map((f) => ({ ...f, master: r.master })))
log(`Council returned ${allFindings.length} findings across ${clean.length}/12 masters`)

phase('Synthesis')
const mot = await agent(
  `You are the Master of Thought (MoT), directing the 12 Ascended Masters' derisk review of the eXeL-AI Innovation Project.\n\n` +
  `Here are all findings (JSON):\n${JSON.stringify(allFindings, null, 1)}\n\n` +
  `And each master's grade + summary:\n${JSON.stringify(clean.map((r) => ({ master: r.master, grade: r.grade, summary: r.summary })), null, 1)}\n\n` +
  `Synthesize into: (1) direction to the team; (2) applyNow — the DEDUPED, verified, safe (additive/gated/no un-asked UI change) fixes to apply automatically now, ranked by value; ` +
  `(3) defer — real but larger/risky items to report not apply (e.g. full i18n migration, server-side persistence, migration-apply as a deploy step, real per-project gate metrics); ` +
  `(4) residualRisks after the applyNow fixes land; (5) grades — carry each master's grade through. Be rigorous: drop anything speculative or that you cannot tie to a concrete file location.`,
  { label: 'MoT:synthesis', phase: 'Synthesis', schema: MOT_SCHEMA, effort: 'high', agentType: 'general-purpose' },
)

return { mot, masters: clean.map((r) => ({ master: r.master, grade: r.grade, summary: r.summary, findings: r.findings })), findingCount: allFindings.length }
