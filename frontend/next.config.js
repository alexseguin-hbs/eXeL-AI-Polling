/** @type {import('next').NextConfig} */
const { execSync } = require('child_process');

// Resolve 7-char SHA: Cloudflare Pages injects CF_PAGES_COMMIT_SHA automatically
let gitSha = 'dev';
try {
  const cfSha = process.env.CF_PAGES_COMMIT_SHA;
  gitSha = cfSha
    ? cfSha.substring(0, 7)
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
