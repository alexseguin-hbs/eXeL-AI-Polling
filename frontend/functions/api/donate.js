/**
 * Cloudflare **Pages** Function — thin adapter over the shared donate core.
 *
 * ⚠ THIS FILE DOES NOT RUN ON THE CURRENT DEPLOYMENT. The site ships as Workers Static Assets
 * (wrangler.jsonc → main: worker.js), and Pages Functions are never executed there — which is
 * exactly why donations failed: POST /api/donate fell through to the SPA fallback and returned
 * index.html with a 200. The live route now lives in worker.js. This adapter is kept, and reduced
 * to a one-liner, so that a future move BACK to Pages cannot resurrect a second, drifted copy of
 * the Stripe flow. One implementation: ../../donate-core.js.
 */
import { handleDonate } from "../../donate-core.js";

export const onRequest = (context) => handleDonate(context.request, context.env);
