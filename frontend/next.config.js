/** @type {import('next').NextConfig} */
const { execSync } = require('child_process');

// Resolve the 7-char SHA shown in the footer banner (app/layout.tsx). Each builder names this differently, and
// getting it wrong is not cosmetic: the banner is how we tell a stale deploy from a fresh one, and reading the
// wrong variable is part of why a 4-hour-old build went unnoticed.
//   WORKERS_CI_COMMIT_SHA — Cloudflare *Workers* Builds (this project: wrangler.jsonc + worker.js)
//   GITHUB_SHA            — GitHub Actions
//   CF_PAGES_COMMIT_SHA   — Cloudflare *Pages* only; never set here, kept for portability
//   git rev-parse         — local builds (and any CI that checks out with history)
let gitSha = 'dev';
try {
  const ciSha =
    process.env.WORKERS_CI_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.CF_PAGES_COMMIT_SHA;
  gitSha = ciSha
    ? ciSha.substring(0, 7)
    : execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

// Build timestamp in CST (America/Chicago handles CST/CDT automatically)
const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const cst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
const buildDate = `${cst.getFullYear()}.${pad(cst.getMonth() + 1)}.${pad(cst.getDate())}`;
const buildTime = `${pad(cst.getHours())}:${pad(cst.getMinutes())} CST`;

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Security headers handled by public/_headers (CF Pages reads that file directly)
  env: {
    NEXT_PUBLIC_GIT_SHA: gitSha,
    NEXT_PUBLIC_BUILD_DATE: buildDate,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
};

module.exports = nextConfig;
