# Fitness-2525 · Human (HI) Test Checklist

Short manual checklist after deploying or running Fitness-2525 locally.

## Local run

```bash
cd frontend && npm run dev
```

Open [http://localhost:3000/Fitness-2525/](http://localhost:3000/Fitness-2525/).

**Note:** Live Cloudflare Workers need a deploy after merge for cloud/`/api/ai` to match this branch.

## Checklist

1. **Chrome / tabs** — Open `/Fitness-2525/` and confirm Security PLANNING chrome (dark tactical layout, status strip, badges). Tabs: LIVE TODAY, ENERGY, PLANNING, NUTRITION, COACH.
2. **Auth0 + cloud** — SIGN IN via Auth0; confirm cloud status label (e.g. LINK: READY / SYNC… / SECURE, or LOCAL when signed out).
3. **Check-in + workout** — Log a quick check-in; toggle a workout to done (and back if needed).
4. **ENERGY rates** — On ENERGY, toggle `$/min` vs `$/sec`. Rates show dashes until calories and `$/kcal` are set (no invented numbers).
5. **COACH** — Request an AI note via Worker `/api/ai`, edit the note, save.
6. **Privacy Policy** — Footer **Privacy Policy** link opens `/Fitness-2525/privacy-policy` and the static `/Fitness-2525/privacy-policy.html`.
7. **Mobile** — Narrow the viewport (~mobile width); layout stays usable (no broken columns / clipped controls).
8. **Issues** — Report problems to [explore@eXeL-AI.com](mailto:explore@eXeL-AI.com).

Fitness-only paths; do not regress non-Fitness apps in this pass.
