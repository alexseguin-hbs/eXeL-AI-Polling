/**
 * Fitness-2525 · Privacy Policy (A2P SMS)
 * Public page for Twilio A2P Campaign privacy URL.
 * Brand: eXeL AI · Product: Fitness-2525
 */
import type { CSSProperties, ReactNode } from "react";

const C = {
  bg: "#0a0e14",
  panel: "#111826",
  border: "#1e2b3a",
  text: "#c8d6e5",
  dim: "#5f7186",
  cyan: "#19c8cf",
};

const wrap: CSSProperties = {
  minHeight: "100vh",
  background: C.bg,
  color: C.text,
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

const card: CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "40px 24px 64px",
};

const h1: CSSProperties = {
  color: "#fff",
  fontSize: 28,
  fontWeight: 700,
  margin: "0 0 8px",
  letterSpacing: "-0.02em",
};

const h2: CSSProperties = {
  color: C.cyan,
  fontSize: 14,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  margin: "28px 0 10px",
};

const p: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.65,
  margin: "0 0 12px",
  color: C.text,
};

const muted: CSSProperties = {
  ...p,
  color: C.dim,
  fontSize: 13,
};

const badge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 11,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: C.cyan,
  fontWeight: 700,
  marginBottom: 16,
};

const panelBox: CSSProperties = {
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  background: C.panel,
  padding: "20px 22px",
  margin: "16px 0",
};

const link: CSSProperties = {
  color: C.cyan,
  textDecoration: "none",
};

const ul: CSSProperties = {
  margin: "0 0 12px",
  paddingLeft: 22,
  fontSize: 15,
  lineHeight: 1.7,
  color: C.text,
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

export function FitnessPrivacyPolicy() {
  return (
    <div style={wrap} data-fit-privacy>
      <main style={card}>
        <div style={badge}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.cyan,
              boxShadow: `0 0 12px ${C.cyan}`,
            }}
          />
          eXeL AI · Fitness-2525
        </div>

        <h1 style={h1}>Privacy Policy</h1>
        <p style={muted}>
          Registered brand: <strong style={{ color: C.cyan }}>eXeL AI</strong>
          {" · "}
          Product: Fitness-2525 SMS check-ins
        </p>

        <div style={panelBox}>
          <p style={{ ...p, marginBottom: 0, fontWeight: 600 }}>
            We do not sell or share your SMS opt-in data or personal information with third parties for marketing purposes.
          </p>
        </div>

        <Section title="Who we are">
          <p style={p}>
            This Privacy Policy applies to <strong>Fitness-2525</strong>, a personal fitness and training
            SMS check-in product operated under the registered brand <strong>eXeL AI</strong>.
          </p>
        </Section>

        <Section title="Information we collect">
          <p style={p}>When you use Fitness-2525 SMS check-ins, we may collect:</p>
          <ul style={ul}>
            <li>Your phone number</li>
            <li>Message content you send (training and nutrition logs / check-in replies)</li>
            <li>Consent and opt-in status</li>
            <li>Timestamps of messages and consent events</li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <p style={p}>
            We use this information only to send Fitness-2525 training and nutrition check-in texts,
            to record your replies, and to improve your personal training or nutrition plan.
            We do not use SMS opt-in data for third-party marketing.
          </p>
        </Section>

        <Section title="SMS terms">
          <ul style={ul}>
            <li>
              <strong>Opt in:</strong> Provide your phone number and confirm consent through the
              Fitness-2525 enrollment / opt-in flow (or reply as instructed when you join).
            </li>
            <li>
              <strong>Opt out:</strong> Reply <strong>STOP</strong> at any time to cancel SMS messages.
            </li>
            <li>
              <strong>Help:</strong> Reply <strong>HELP</strong> for assistance.
            </li>
            <li>
              <strong>Frequency:</strong> Up to about 3 check-in messages per day.
            </li>
            <li>Message and data rates may apply.</li>
          </ul>
        </Section>

        <Section title="Contact">
          <p style={p}>
            Questions about this Privacy Policy or Fitness-2525 SMS:{" "}
            <a href="mailto:explore@eXeL-AI.com" style={link}>
              explore@eXeL-AI.com
            </a>
          </p>
        </Section>

        <p style={{ ...muted, marginTop: 32 }}>
          <a href="/Fitness-2525" style={link}>
            ← Back to Fitness-2525
          </a>
        </p>
      </main>
    </div>
  );
}

export default FitnessPrivacyPolicy;
