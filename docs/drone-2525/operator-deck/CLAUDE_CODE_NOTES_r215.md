# Drone-2525 r.215 — THE HISTORY OWNS THE SCREEN (2026-10-17)

Artefact `8fc06f0` · deck sha256 `{H215}` · `HASHES_r215.sha256` · patch `patches/r214_to_r215.py`
Red-first `redfirst/r215.md`

## His words

> *"Ensure this is full screen for portraight and landscape and pc; also I dont see `</>` and `</> Code` unlock
> of code"* — with a phone screenshot of the panel open (`…_shot68.png`).

Two asks. **This revision answers the first and names the second rather than half-doing it.**

## What he was looking at, measured

`#rcorePanel .rcSheet` was `max-width: 640px; max-height: 88vh` inside an overlay adding 8 px of side padding.

| | before | after |
|---|---|---|
| his phone, 428 × 926 | **428 × 815**, the game showing around it | **428 × 926** at (0,0) |
| landscape, 926 × 428 | a letterbox | **926 × 428** at (0,0) |
| desktop, 1440 × 900 | **640 × 792 at x = 400** — a column adrift | **1440 × 900** at (0,0) |

## The shared React panel had the same shape

`components/2525-core/rcore-revision-panel.tsx:178` was the same `maxWidth: 640, maxHeight: "88vh"`, so the
identical change lands there and **every 2525 surface gains it in the same commit** — SoI, Security, Architect,
Celestial, Financial, Settings, SensorFusion, SIM and the Drone route.

## A reading column inside the full bleed — declared

The sheet owns the glass; the *content* is centred at **1100 px**. "Full screen" is about the panel owning the
screen, which it now does edge to edge; a line of prose 2560 px wide would obey the letter and lose the point.
One number if he wants it truly edge to edge.

## The gates

- **`THE_HISTORY_OWNS_THE_SCREEN`** — deferred, opens the real panel, measures the real rect against the real
  viewport, and requires both `max-width` and `max-height` to be uncapped. Red-first: `428x815 in a 428x926
  window` and `640x792 … at (400,0)`.
- **Three legs in `rcore-revisions`** for the shared panel: uncapped in both axes; the 640/88vh card gone **from
  the code**; the overlay adds no inset and the content keeps its reading width. 49/3 before, 52/0 after.

**Nothing pinned that geometry before today** — which is how a 640 px card survived nine surfaces.

## The trap, recorded because it is the third of its kind this session

The `88vh` leg first matched **its own explanatory comment**. It strips comment lines now and was re-proved able
to fail. The other two: the serialisation needle counting its own string literal (r.214), and a boot leg that
passed because the listener it tested had not been registered yet (r.214). Same lesson: **a check that can see
its own text is not checking anything.**

## DD-79 — the second half, named not bundled

The deck's panel is a hand-written vanilla port carrying only `cmpVU` and `cmpVS`; `grep` returns no `cmpVC`, so
there is nothing on the deck to press. The `</>` chip he is asking about ships on the nine **React** surfaces.
Giving the deck Code mode means:

- inlining the **40,904 B** index (`lib/2525-core/drone-2525-code.gen.ts`) — the 4.2 MB of patch payloads cannot
  come, because the deck fetches nothing by law;
- porting the 27-block cube into vanilla;
- carrying his two `</>` rasters as data URIs (946 KB + 1.39 MB as sent — they need resampling as r.210 did);
- the three beats, and the chip strip over a `<pre>`.

A build, not a CSS change. **It is next.**

## Owed, carried

No `test:drone-play` runner in CI · 428×926 is still not a CI viewport · r.151–r.164 still read `PENDING` in the
register's ship column · the deck is English only (DD-60) · the Cloudflare KV namespace id is his.
