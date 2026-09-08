# Operator ask — 2026-09-08 ~00:15 UTC (verbatim, persisted before analysis)

> [screenshot: "Why can't I sign?" on build bc4a179 — Sign backend: migration 036 is NOT applied on this site's Supabase; Login: signed in · explore@exel-ai.com; sentence: "Migration 036 is not applied … Signing alone on this phone still works."]
> fix after download enabled

Context: download without Supabase shipped in 03292f8 (offline hand-off). The remaining fix is applying
migration 036 on the hosted Supabase — which only the operator can do; the page should make that one tap.
