import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function sha256Buffer(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Run a command, capture stdout/stderr, write evidence files, return structured record.
 * Never maps skipped→pass. Exit non-zero → fail (unless blocked signal in env).
 */
export function runAndRecord({ id, command, args = [], cwd, evidenceDir, env = {}, timeoutMs = 120_000, notAvailable = false, blockedReason = null }) {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = path.join(evidenceDir, `${id}-${stamp}`);

  if (notAvailable) {
    const rec = {
      id,
      command: [command, ...args].join(" "),
      status: "not_available",
      exit_code: null,
      stdout_sha256: null,
      stderr_sha256: null,
      duration_ms: 0,
      evidence_files: [],
      note: "command/source not present on this SHA (unmerged worker tree)",
    };
    fs.writeFileSync(base + ".json", JSON.stringify(rec, null, 2));
    return rec;
  }
  if (blockedReason) {
    const rec = {
      id,
      command: [command, ...args].join(" "),
      status: "blocked",
      exit_code: null,
      stdout_sha256: null,
      stderr_sha256: null,
      duration_ms: 0,
      evidence_files: [],
      note: blockedReason,
    };
    fs.writeFileSync(base + ".json", JSON.stringify(rec, null, 2));
    return rec;
  }

  const t0 = Date.now();
  const r = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: timeoutMs,
    maxBuffer: 20 * 1024 * 1024,
  });
  const duration_ms = Date.now() - t0;
  const stdout = r.stdout ?? "";
  const stderr = r.stderr ?? "";
  const outPath = base + ".stdout.txt";
  const errPath = base + ".stderr.txt";
  fs.writeFileSync(outPath, stdout);
  fs.writeFileSync(errPath, stderr);
  const exit_code = typeof r.status === "number" ? r.status : 1;
  const status = exit_code === 0 ? "pass" : "fail";
  const rec = {
    id,
    command: [command, ...args].join(" "),
    cwd,
    status,
    exit_code,
    duration_ms,
    stdout_sha256: sha256Buffer(Buffer.from(stdout)),
    stderr_sha256: sha256Buffer(Buffer.from(stderr)),
    evidence_files: [path.basename(outPath), path.basename(errPath)],
    timed_out: Boolean(r.error && r.error.code === "ETIMEDOUT"),
    error: r.error && !r.error.code === "ETIMEDOUT" ? String(r.error.message || r.error) : null,
  };
  fs.writeFileSync(base + ".json", JSON.stringify(rec, null, 2));
  return rec;
}

export function gitHeadSha(repoRoot) {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" });
  return (r.stdout || "").trim();
}

export function pathExists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}
