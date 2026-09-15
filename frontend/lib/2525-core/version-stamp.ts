// U-WF-12 — ONE VERSION STAMP for every Vision • 2525 surface. The same four facts in the same order,
// so a screenshot of any domain play can be traced back to a commit: revision · build date · build time · sha.
//
// The string is built from build-time env only — never Date.now() — so two renders of the same build stamp
// identically and a determinism gate can compare them (WIREFRAME-CORE U-WF-08).
//
// Shape: `eXeL v0.001-2026.09.15-15.44CST · 8e04a0f`
export interface StampParts { revision: string; date: string; time: string; sha: string }

export const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? "dev";
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE ?? "";
const BUILD_TIME = (process.env.NEXT_PUBLIC_BUILD_TIME ?? "").replace(":", ".").replace(" ", "");

/** Pure: the caller supplies every part, so a test can assert the shape without a build. */
export function formatStamp(p: StampParts): string {
  const when = p.date && p.time ? `${p.date}-${p.time}` : "dev";
  return `eXeL ${p.revision}-${when} · ${p.sha}`;
}

/** The stamp for THIS build, at a domain's declared revision (e.g. "v0.001"). */
export const versionStamp = (revision = "v0.001"): string =>
  formatStamp({ revision, date: BUILD_DATE, time: BUILD_TIME, sha: GIT_SHA });
