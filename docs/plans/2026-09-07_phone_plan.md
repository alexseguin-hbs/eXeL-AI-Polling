# Plan — phone edition (2026-09-07, evening)
*Short on purpose: the Thought Master is on a phone.*

**P1 · One colour scheme.** Every new surface — landing rings and cards, the pod's phase rail, the
sign and create pages, receipts, headers — follows the site theme: AI Cyan by default, or the preset
picked in Settings. No fixed yellow/violet. The three glyphs ◬ ♡ 웃 keep identity by shape; tone
(bright / mid / dim of the one hue) tells the rings apart. Contrast fixed as a side effect.
*Doing now.*

**P2 · Sign your PDF, alone, from the phone.** Footer SHA ≥ 8185a98 → Sign Doc → add PDF → Next →
✕ on Signer 2 → Next → tap the page → Next → draw → Sign & save → Download. Seven taps.

**P3 · Migration 036, from the phone.** Supabase dashboard → SQL editor → paste the file
(`supabase/migrations/036_sign_envelopes.sql` on GitHub, raw view) → Run. Idempotent. Then the
two-signer test with Daniel: same steps, keep Signer 2, tap Send by text.

**P4 · Stripe, from the phone.** Cloudflare dashboard → Workers & Pages → exel-ai-polling → Settings
→ Variables and Secrets → Add secret `STRIPE_RESTRICTED_KEY` (or `STRIPE_SECRET_KEY`). Then ♡ Donate
→ $1.11 must open checkout.stripe.com. Until then every donate button shows the honest demo state.

**P5 · Manta session (needs three phones, or one phone as a dry run).** ◬ ♡ 웃 Session → Use a
sample topic, or pick Manta-2525 → the three Rev D tasks are pre-seeded (number register ·
life-support bound · Ark carry gate) → invite two → run → record → witness → receipt.

**P6 · Later, not tonight.** 33-language strings for the new surfaces · receipts written to a table ·
"verify this file" button · the Deploy Action's build-vars secrets.
