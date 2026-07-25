# Fixing the donate flow — eXeL AI Polling

**Symptom:** the donate modal shows *"Donation could not be started. Please try again."*
**Cause:** the Worker never successfully creates a Stripe Checkout Session, so there's no URL to send the browser to.
**Time needed:** about 20 minutes.
**You do not need to understand Stripe to follow this.** Every command below is copy-paste, and each one tells you what a correct result looks like.

---

## Before you start

You need three things open:

1. A terminal, in the project folder (the one containing `wrangler.toml`).
2. The Stripe Dashboard — https://dashboard.stripe.com
3. The file `donate-worker.js` (delivered alongside this document).

Confirm wrangler is installed and you're logged in:

```
wrangler --version
wrangler whoami
```

`whoami` should print your email and account name. If it says you're not authenticated, run `wrangler login` and complete the browser prompt.

---

## Step 1 — Find out whether the key is even set

This is the single most likely cause. A key placed in `.dev.vars` works locally and is **not** uploaded on deploy, so production has no key at all.

```
wrangler secret list
```

**What you're looking for:** a line containing `STRIPE_SECRET_KEY`.

- **It's missing** → this is your bug. Continue to Step 2.
- **It's there** → the key exists but may be wrong or expired. Do Step 2 anyway; re-setting it costs nothing and rules it out.

> If your `wrangler.toml` defines environments (`[env.production]`), secrets are per-environment. Check the one you actually deploy to:
> `wrangler secret list --env production`

---

## Step 2 — Get the key and install it

### 2a. Copy the key from Stripe

1. Go to https://dashboard.stripe.com/test/apikeys
2. Make sure the **Test mode** toggle in the top-right is **ON**. Test mode works immediately even if your account isn't fully activated.
3. Find the row **Secret key**. Click **Reveal test key**.
4. Copy it. It begins with `sk_test_`.

> Two keys are shown on that page. The *Publishable* key starts with `pk_` and is the wrong one — it will produce an authentication error. You want the one starting with `sk_`.
>
> Never paste a `sk_` key into frontend code, a git commit, or a chat message. It can move money. If one is ever exposed, click **Roll key** on that same page immediately.

### 2b. Install it in the Worker

```
wrangler secret put STRIPE_SECRET_KEY
```

The terminal will pause and ask for the value. Paste the key and press Enter. Nothing appears as you paste — that's intentional, it's hidden input.

**Expected output:**

```
✨ Success! Uploaded secret STRIPE_SECRET_KEY
```

If you use named environments, repeat with `--env production`.

---

## Step 3 — Install the handler

1. Copy `donate-worker.js` into your source folder (next to your Worker entry file — typically `src/`).

2. Open your Worker entry file. Find it by opening `wrangler.toml` and reading the `main = ` line; that's the path.

3. At the very top of that entry file, add:

```js
import { handleDonate } from './donate-worker.js';
```

4. Inside the `fetch` handler, add the route **before** any catch-all or 404 response. It should look roughly like this:

```js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ↓↓↓ ADD THIS ↓↓↓
    if (url.pathname === '/api/donate') {
      return handleDonate(request, env);
    }
    // ↑↑↑ ADD THIS ↑↑↑

    // ... your existing routes ...
  },
};
```

Order matters. If a catch-all route sits above it, the donate request never reaches the handler.

---

## Step 4 — Point the donate button at it

Find the code behind the **"Continue to secure checkout"** button. Replace whatever it currently does with this:

```js
async function startDonation(amountInDollars) {
  setError(null);
  setBusy(true);                        // disable the button while in flight

  try {
    const res = await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountInDollars }),   // 1.11 — dollars, not cents
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;   // hand off to Stripe's hosted page
    } else {
      setError(data.error || 'Donation could not be started. Please try again.');
    }
  } catch {
    setError('Network problem. Check your connection and try again.');
  } finally {
    setBusy(false);
  }
}
```

**Send dollars, not cents.** The handler converts to cents itself. If both sides convert, a $1.11 donation becomes $111.00.

---

## Step 5 — Deploy and watch it work

Open **two** terminal windows in the project folder.

**Window 1** — deploy:

```
wrangler deploy
```

**Window 2** — live log stream:

```
wrangler tail --format pretty
```

Leave Window 2 running. Now open the site on your phone, open the donate modal, pick $1.11, and tap **Continue to secure checkout**.

**Success looks like:** the browser leaves your site and lands on a `checkout.stripe.com` page showing "Support eXeL AI · $1.11".

**Failure looks like:** the red error again — but Window 2 now prints the real reason. Take that line to Step 7.

---

## Step 6 — Complete a test payment

On the Stripe page, use the test card. It is not a real card and moves no money:

| Field | Value |
|---|---|
| Card number | `4242 4242 4242 4242` |
| Expiry | any future date, e.g. `12/34` |
| CVC | any 3 digits, e.g. `123` |
| Name / ZIP | anything |

Submit. You should be returned to `/donate/thanks`.

Confirm it registered: https://dashboard.stripe.com/test/payments — your $1.11 appears at the top, marked **Succeeded**.

**If `/donate/thanks` 404s**, the payment still worked; you just haven't built that page yet. Either add it, or open `donate-worker.js` and change `success_url` to a page that exists.

---

## Step 7 — If it still fails: read the error

`wrangler tail` prints Stripe's actual `message`. Match it here:

| Message contains | Meaning | Fix |
|---|---|---|
| `Invalid API Key provided` | Key is wrong, truncated, or rolled | Redo Step 2. Watch for a trailing space on paste |
| `You did not provide an API key` | Secret didn't reach this environment | Redo Step 2 with `--env <your-env>` |
| `Invalid integer` | Dollars reached Stripe instead of cents | Something else is also converting. Send raw dollars from the client (Step 4) |
| `amount_too_small` | Under Stripe's $0.50 USD floor | Raise the amount, or lower `MIN_CENTS` |
| `Not a valid URL` | `success_url` is relative | The handler builds these automatically — check nothing overwrote them |
| `similar object exists in test mode` | Live key with test data, or reverse | Match key mode to dashboard mode |
| *(nothing prints at all)* | Request never reached the handler | Route is below a catch-all, or the path doesn't match `/api/donate` |

---

## Step 8 — Going live (only when test mode works end to end)

1. Complete account activation: https://dashboard.stripe.com/account/onboarding — Stripe requires business and bank details before live keys function.
2. Switch the dashboard **Test mode** toggle OFF, go to API keys, reveal the key beginning `sk_live_`.
3. `wrangler secret put STRIPE_SECRET_KEY` and paste the live key. This overwrites the test key.
4. `wrangler deploy`
5. Donate $1.11 to yourself with a real card. Refund it from the dashboard afterward.

---

## Known follow-ups (not blockers)

**Modal overflows the screen.** On the phone, `$3.33`, `$25.25`, and the right edge of the checkout button are clipped. In the modal's stylesheet:

```css
.donate-card {
  max-width: 100%;
  box-sizing: border-box;
}
.donate-amount-grid {
  min-width: 0;   /* lets grid children shrink instead of forcing overflow */
}
```

**No webhook yet.** Right now the site learns about a payment only if the donor's browser makes it back to the success URL. If they close the tab on Stripe's page, you get the money but record nothing. Add a `/api/stripe-webhook` route listening for `checkout.session.completed` before you rely on donation records for anything.

**Error copy.** *"Donation could not be started. Please try again."* doesn't tell anyone what to do. Once the specific cases are known, say the useful thing instead — e.g. *"Enter an amount of $1.00 or more."*

---

## Rollback

If anything breaks the site, revert the entry file to its previous commit and redeploy:

```
git checkout HEAD~1 -- <path/to/entry-file>
wrangler deploy
```

The secret can stay; an unused secret is harmless.
