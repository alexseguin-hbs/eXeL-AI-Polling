#!/usr/bin/env node
// The render smoke in `postbuild`, wherever a Chromium exists. Cloudflare's build image carries none, and a build that cannot
// run the smoke must SAY so rather than pretend (MoT 11: skipped is a fourth state) — but it must not break the door that
// ships. deploy.yml runs the smoke as its own required step, where Chromium is installed.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const candidates = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
const exe = candidates.find((p) => existsSync(p));
if (!exe && !process.env.SMOKE_REQUIRED) { console.log('render-smoke: SKIPPED — no Chromium on this builder (set SMOKE_REQUIRED=1 to make that a failure; deploy.yml runs it as a required step)'); process.exit(0); }
const r = spawnSync(process.execPath, [new URL('./drone-render-smoke.mjs', import.meta.url).pathname], { stdio: 'inherit', env: { ...process.env, CHROMIUM_PATH: exe || '' } });
process.exit(r.status ?? 1);
