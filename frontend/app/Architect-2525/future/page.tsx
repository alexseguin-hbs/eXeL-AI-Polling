// /Architect-2525/future — PHASE 0 placeholder. Architect-2525/Future is a GREENFIELD rebuild
// (operator / H.I. Thought Master, 2026-11-08). This route intentionally imports NOTHING from the
// legacy Architect surface: Phase 0 is contracts + scaffold + tests only, and the production UI is
// not built until Phase 2 (plan §38). The working Design tool stays at /Architect-2525/.
// Plan of record: docs/architect-future/ARCHITECT-2525_FUTURE_PLAN.md.
export const metadata = { title: "Architect-2525 / Future" };

const PLAN_URL =
  "https://github.com/alexseguin-hbs/eXeL-AI-Polling/blob/main/docs/architect-future/ARCHITECT-2525_FUTURE_PLAN.md";

export default function Page() {
  const sha = process.env.NEXT_PUBLIC_GIT_SHA ?? "dev";
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem 1rem",
        textAlign: "center",
        background: "#070b12",
        color: "#e6f6ff",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <p style={{ letterSpacing: "0.3em", fontSize: "0.7rem", color: "#4fd6e0" }}>ARCHITECT-2525</p>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 600, margin: 0 }}>Future</h1>
      <p style={{ fontSize: "0.95rem", color: "#9fb3c8", maxWidth: "32rem", margin: 0 }}>
        Phase&nbsp;0 — contracts in review. The new, ground-up Architect is being built here as a separate
        route. Nothing is wired yet; the working design tool stays at{" "}
        <a href="/Architect-2525/" style={{ color: "#b45cff" }}>/Architect-2525</a>.
      </p>
      <a
        href={PLAN_URL}
        style={{
          marginTop: "0.5rem",
          border: "1px solid #4fd6e0",
          color: "#4fd6e0",
          borderRadius: "0.5rem",
          padding: "0.5rem 1rem",
          fontSize: "0.85rem",
          textDecoration: "none",
        }}
      >
        Read the plan of record →
      </a>
      <p style={{ fontSize: "0.65rem", color: "#5b7085", marginTop: "1.5rem", fontFamily: "ui-monospace, monospace" }}>
        Phase&nbsp;0 · 2026.11.08 · SHA {sha}
      </p>
    </main>
  );
}
