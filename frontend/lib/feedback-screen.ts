/**
 * WHICH SITE A FEEDBACK CAME FROM (operator 2026-10-02, addendum 128: "ensure feedback when operation Financial-2525 goes and gets
 * logged for Financial-2525 · same holds true with eXeL Polling and other sub sites").
 *
 * One table, every route: the footer's Feedback button tags each submission with the sub-site it was sent from, so Financial-2525
 * feedback is logged as Financial-2525, Drone-2525 as Drone-2525, the polling screens as polling, and so on. Before r.057 every
 * 2525 page was filed as "other". Order matters: the first prefix that matches wins (longest first). Pure.
 */
export interface FeedbackSite { screen: string; site: string }

const TABLE: readonly [prefix: string, screen: string, site: string][] = [
  ["/main/Financial-2525", "financial-2525", "Financial-2525"],
  ["/financial-2525", "financial-2525", "Financial-2525"],
  ["/main/Drone-2525", "drone-2525", "Drone-2525"],
  ["/drone-2525", "drone-2525", "Drone-2525"],
  ["/main/Security-2525", "security-2525", "Security-2525"],
  ["/Security-2525", "security-2525", "Security-2525"],
  ["/Security", "security-2525", "Security-2525"],
  ["/main/Architect-2525", "architect-2525", "Architect-2525"],
  ["/Architect-2525", "architect-2525", "Architect-2525"],
  ["/Architect", "architect-2525", "Architect-2525"],
  ["/main/Celestial-2525", "celestial-2525", "Celestial-2525"],
  ["/Celestial-2525", "celestial-2525", "Celestial-2525"],
  ["/main/SoI-2525", "soi-2525", "SoI-2525"],
  ["/SoI-2525", "soi-2525", "SoI-2525"],
  ["/soi-session", "soi-session", "SoI Session"],
  ["/innovation", "innovation", "Innovation Pod"],
  ["/review-2525", "review-2525", "Review-2525"],
  ["/vision-2525", "vision-2525", "Vision-2525"],
  ["/divinity-guide", "divinity-guide", "Divinity Guide"],
  ["/Atlantis-Accords", "atlantis-accords", "Atlantis Accords"],
  ["/atlantis", "atlantis-accords", "Atlantis Accords"],
  ["/light-codex", "light-codex", "Light Codex"],
  ["/encrypted-messaging", "encrypted-messaging", "Encrypted Messaging"],
  ["/main/experiences", "experiences", "Experiences"],
  ["/experiences", "experiences", "Experiences"],
  ["/workspace", "workspace", "Workspace"],
  ["/crs", "crs", "CRS Matrix"],
  ["/api", "api", "Governance Engine API"],
  ["/sim", "sim", "eXeL AI Polling · Simulation"],
  ["/dashboard", "dashboard", "eXeL AI Polling"],
  ["/session", "polling", "eXeL AI Polling"],
  ["/poll", "polling", "eXeL AI Polling"],
  ["/join", "join", "eXeL AI Polling"],
  ["/main", "main", "eXeL AI"],
];

export function feedbackSite(pathname: string): FeedbackSite {
  const p = (pathname || "/").replace(/\/+$/, "") || "/";
  if (p === "/") return { screen: "landing", site: "eXeL AI Polling" };
  const lower = p.toLowerCase();
  for (const [prefix, screen, site] of [...TABLE].sort((a, b) => b[0].length - a[0].length)) {
    const q = prefix.toLowerCase();
    if (lower === q || lower.startsWith(q + "/")) return { screen, site };
  }
  return { screen: "other", site: "eXeL AI" };
}
export const FEEDBACK_SITES = TABLE;
