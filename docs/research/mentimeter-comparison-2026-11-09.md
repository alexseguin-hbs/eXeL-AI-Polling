# Mentimeter vs eXeL AI Polling — comparison (2026-11-09)

**Date:** 2026-11-09 (America/Chicago)  
**Workstream:** engagement-si  
**Sources:** Mentimeter public product / Help Center / pricing only. No invented features or prices.  
**Scope:** How Mentimeter works (create, join, present, question types, results, free vs paid) vs eXeL’s creator → join → input → theming → voting → results flow. Ends with prioritized UX gaps and CRS mapping.

---

## 1. Mentimeter — how it works (cited)

### 1.1 Who can create / sign-up

- Anyone can create a free Mentimeter account and build presentations (“Mentis”). Free is permanent, not a time-limited trial ([Help Center — free account](https://help.mentimeter.com/en/articles/1258367-what-is-included-in-the-free-account)).
- Paid plans are **per presenter / month** (Basic / Pro / Enterprise). Mentimeter states that accounts must not be shared — each person who creates/edits/presents needs their own login ([Help Center — which plan](https://help.mentimeter.com/en/articles/5938993-which-plan-is-right-for-you); [Pricing](https://www.mentimeter.com/plans)).
- Tools: **Menti Live** (presenter-paced), **Menti Form**, **Menti Pulse** (async / scheduled) ([free-account help](https://help.mentimeter.com/en/articles/1258367-what-is-included-in-the-free-account)).

### 1.2 Create → present

1. Sign in → **New Menti** (or New survey / import) ([How to](https://www.mentimeter.com/how-to); education guides summarizing the same flow).
2. Add slides (interactive questions + content). Auto-saves.
3. **Present** / Start presentation — join code, QR, and participation link become the audience entry points ([How to participate](https://help.mentimeter.com/en/articles/410537-how-to-participate-in-a-menti)).
4. Presenter advances slides; audience answers on their own phone/laptop. No app install required ([How to FAQ](https://www.mentimeter.com/how-to)).

### 1.3 Join-by-code flow (audience)

Three official join paths ([How to participate](https://help.mentimeter.com/en/articles/410537-how-to-participate-in-a-menti)):

| Path | How |
|------|-----|
| Participation link | Direct URL from Share → Participation link |
| QR code | Camera scan; also downloadable from Share |
| Join code (Menti Live) | Go to **menti.com**, enter the temporary code shown on the slide |

Audience responses are anonymous by default; names / SSO verification are paid-plan options ([Pricing compare table](https://www.mentimeter.com/plans)).

### 1.4 Presenter vs audience views

- **Presenter / Presentation view:** full-screen results that update live as votes arrive; keyboard shortcuts; optional Mentimote phone remote (Pro+) ([in-person prep](https://help.mentimeter.com/en/articles/1382424-get-ready-for-your-in-person-menti); [Pricing](https://www.mentimeter.com/plans)).
- **Audience view:** phone/browser form for the **current** question only (presenter pace) or self-paced survey mode for Forms/surveys (education guides).
- Results can be hidden until the presenter reveals them (educator guide / Help Center practice).

### 1.5 Question types (Live)

Interactive question slides listed by Mentimeter Help ([Quiz vs Question](https://help.mentimeter.com/en/articles/6385783-what-s-the-difference-between-quiz-slides-and-question-slides)):

- Word Cloud, Open Ended, Multiple Choice, Scales, Ranking, Q&A, Guess the Number, 100 points, 2×2 Grid, Quick Form (Pro), Pin on Image.
- **Quiz competitions:** Select Answer / Type Answer with scoring, countdown, Leaderboard (not interchangeable with Survey mode).

Open Ended: up to **200 characters** per response; optional multiple responses; optional **Vote on Responses** ([Open Ended](https://help.mentimeter.com/en/articles/410470-how-to-use-open-ended-slides-in-menti-live)).

### 1.6 Results display

- Live visuals as answers arrive ([How to](https://www.mentimeter.com/how-to)).
- Multiple Choice layouts: Bars, Donut, Pie, Dots ([Results layout](https://help.mentimeter.com/en/articles/2350085-change-the-results-layout-for-your-menti)).
- Open Ended layouts: Speech bubbles, Flowing grid (auto-scroll) ([same](https://help.mentimeter.com/en/articles/2350085-change-the-results-layout-for-your-menti); [Open Ended](https://help.mentimeter.com/en/articles/410470-how-to-use-open-ended-slides-in-menti-live)).
- Word Cloud: frequent words grow larger in real time ([Word Cloud feature](https://www.mentimeter.com/features/word-cloud)).
- AI grouping of open answers is mentioned in Mentimeter’s educator materials as a summarization aid ([Educator’s guide](https://help.mentimeter.com/en/articles/11378575-an-educator-s-guide-to-mentimeter)) — eXeL’s Theme01/Theme02 is the deeper analogue, not a Mentimeter clone.

### 1.7 Free vs paid limits & pricing (as of page fetch 2026-11-09)

From [mentimeter.com/plans](https://www.mentimeter.com/plans) and [free-account help](https://help.mentimeter.com/en/articles/1258367-what-is-included-in-the-free-account):

| Plan | Price (page) | Participants / month | Notable limits / extras |
|------|--------------|----------------------|-------------------------|
| Free | $0 | **50** (pool across Mentis; resets on signup anniversary); **one** Live session/month may exceed with 8h grace | Unlimited Mentis; ~23 slide types; Q&A; no import/export |
| Basic | **$11.99** / presenter / month (billed yearly, excl. tax) | Unlimited | Import slides; export image/PDF/Excel; private presentations |
| Pro | **$24.99** / presenter / month (yearly, excl. tax) | Unlimited | Collaboration, branding, Mentimote, moderate Q&A, participant names, Quick Forms |
| Enterprise | Custom | Unlimited | SSO / SCIM, verify participants, LMS, custom retention |

Paid-plan common caps cited in Help: up to **20,000** participants per presentation (**2,000** for Quiz slides); **200** slides per presentation ([Which plan](https://help.mentimeter.com/en/articles/5938993-which-plan-is-right-for-you)).

---

## 2. eXeL AI Polling — current flow (repo-grounded, not Mentimeter)

| Step | eXeL today | Mentimeter analogue |
|------|------------|---------------------|
| Create | Dashboard create session (pricing tier, questions, duration). Payments worker is flipping mock→live; **any signed-in user can create** (user t190). | New Menti after account signup |
| Share | Short code + QR + join URL (`/join?code=…`) | menti.com code / QR / link |
| Join | Language → identity (name or anonymous) → wait for open → participate | Immediate join; anonymous by default |
| Input | Longer free-text (session `max_response_length`, schema up to 3333) + voice STT path; **not** multi-slide MC/word-cloud/quiz | Many slide types; Open Ended ≤200 chars |
| Live feed | Summaries 33/111/(paid 333); moderator dashboard | Instant charts / clouds |
| Theming | Theme01 categories + Theme02 9→6→3 (AI merry-go-round) | Optional AI grouping; word cloud |
| Voting | Ranking rounds (incl. top-3 points CRS-37; auto-select CRS-36; Expert Opinion CRS-38 planned) | Optional vote-on-open-ended; Ranking slide; Quiz leaderboard |
| Results / pay | Pay-to-View / Cost Split / donations (Stripe); unpaid withhold 333 | Free vs paid presenter plans; export on paid |
| Engagement credit | Join ♡1 + time entries; **submit path currently credits wall/process time, not proven active typing** | Mentimeter does **not** expose a public ♡/SI engagement ledger (no cited equivalent) |

---

## 3. Step-by-step UX comparison

1. **Creator onboarding:** Mentimeter = free signup in seconds, Present button. eXeL = Auth0 / mock transition; creator identity in upper-right once live (user t189) — payments owns that flip.
2. **Anyone can poll:** Mentimeter free allows unlimited Mentis (participant pool capped). eXeL: **anyone signed in can create** (t190) — align copy and empty-state with that rule once live.
3. **Join friction:** Mentimeter three paths, no account. eXeL join already supports code/QR/link and anonymous — keep parity; avoid forcing OAuth on participants.
4. **Question variety:** Mentimeter wins on MC / scales / word cloud / quiz. eXeL wins on long-form multilingual text + AI theming + paid depth. Gap = lightweight MC / word-cloud **without** losing Theme02.
5. **Presenter pace:** Mentimeter slide-advance is the default mental model. eXeL is session-phase paced (lobby → polling → ranking → closed). Gap = clearer “you are here” phase + when to speak/type.
6. **Instant visual:** Mentimeter charts update per vote. eXeL live feed + theme bubbles exist; bubble readability / tree 3→6→9 is in flight (voting-gaps). Gap = one obvious “projector” results view.
7. **Reveal control:** Mentimeter hide-until-reveal. eXeL paid gates are payment-based, not presenter-reveal. Gap = optional moderator hide/reveal for unpaid rooms.
8. **Engagement honesty:** Mentimeter has no public SI ledger. eXeL promises ♡ for contribution — must credit **active typing/speaking only** (this workstream) so metrics cannot be gamed by idle join.

---

## 4. Top 10 prioritized UX gaps (eXeL should close) + CRS

| # | Gap | Why it matters vs Mentimeter | Suggested CRS | Owner hint |
|---|-----|------------------------------|---------------|------------|
| 1 | **Active ♡ S.I. only while typing/speaking** (idle/paste capped) | Mentimeter has no fake engagement clock; eXeL must not invent idle ♡ | **CRS-19.09** (new; parent CRS-19/CRS-12) | engagement-si |
| 2 | **Join triad polish:** code + QR + link always visible on creator “Present” surface | Mentimeter Share menu is one glance | CRS-05 / Cube 1 create+share | payments (live) + FE |
| 3 | **Signed-in creator chip** (name/email upper-right) for any poller | Matches “anyone can poll” + Mentimeter account chrome | CRS-05 / Auth path | payments (Auth0 later) |
| 4 | **Projector / Present view** (full-screen live results, phone is input) | Mentimeter Present is the product | CRS-09 live feed / Cube 6–7 display | voting-gaps / FE |
| 5 | **Hide / reveal results** before closing poll | Stops early anchoring (educator Mentimeter practice) | CRS-22.x extension | voting-gaps |
| 6 | **Lightweight MC + word-cloud slides** alongside long-text Theme02 | Mentimeter’s default question types | New CRS under Cube 2/6 (TBD numbering) | backlog |
| 7 | **Theme bubble tree 3→6→9 + tap descriptions (111/222/333)** | Mentimeter AI grouping is shallow; eXeL differentiator must be readable on phone | CRS-09.08 + theme UX (voting #45/#50) | voting-gaps |
| 8 | **Theme02 ≤3 s with metrics per N** | Mentimeter feels instant; eXeL must publish honest N/time | CRS-09.08.* | xai-speed |
| 9 | **Clear free-vs-paid participant limits / pricing copy** | Mentimeter Free=50/mo is famous; eXeL Cost Split / Pay-to-View must be equally plain | CRS-01.01, CRS-39.* | payments |
| 10 | **Export after session** (CSV already; Excel/PDF parity messaging) | Mentimeter gates export on paid | CRS-14.* / CRS-39 | expert-paytoview / reports |

---

## 5. What eXeL should *not* copy blindly

- Per-presenter SaaS caps as the only monetization — eXeL’s Cost Split / Pay-to-View / donations are product-native; keep them, but make the join/pay failure modes as obvious as Mentimeter’s upgrade wall.
- 200-character open-ended limit — eXeL’s longer responses + 333/111/33 summaries are a deliberate advantage.
- Invented ♡ rates — reuse Cube 5 `calculate_tokens` (♡=ceil(active minutes), ◬=5×♡) unless the operator sets a new config value.

---

## 6. Source list (URLs)

1. https://www.mentimeter.com/how-to  
2. https://help.mentimeter.com/en/articles/410537-how-to-participate-in-a-menti  
3. https://help.mentimeter.com/en/articles/1258367-what-is-included-in-the-free-account  
4. https://www.mentimeter.com/plans  
5. https://help.mentimeter.com/en/articles/5938993-which-plan-is-right-for-you  
6. https://help.mentimeter.com/en/articles/6385783-what-s-the-difference-between-quiz-slides-and-question-slides  
7. https://help.mentimeter.com/en/articles/2350085-change-the-results-layout-for-your-menti  
8. https://help.mentimeter.com/en/articles/410470-how-to-use-open-ended-slides-in-menti-live  
9. https://www.mentimeter.com/features/word-cloud  
10. https://help.mentimeter.com/en/articles/1382424-get-ready-for-your-in-person-menti  
11. https://help.mentimeter.com/en/articles/11378575-an-educator-s-guide-to-mentimeter  

*Fetched / searched 2026-11-09. Prices and Free caps are as published on those pages that day; re-check before sales quotes.*
