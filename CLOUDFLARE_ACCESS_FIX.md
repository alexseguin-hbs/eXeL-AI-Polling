# Cloudflare Access / Zero Trust — Remove Auth Gate

The live site (https://exel-ai-polling.explore-096.workers.dev) is currently blocked by
Cloudflare Access requiring a 6-digit email code on every visit.

## Fix: Remove the Access Policy

1. Log in to **https://one.dash.cloudflare.com** (Cloudflare Zero Trust dashboard)
2. Go to **Access > Applications**
3. Find the application matching `exel-ai-polling.explore-096.workers.dev` or `*.workers.dev`
4. Either:
   - **Delete** the Access Application entirely (recommended if no auth needed), or
   - **Edit** it and add a **Bypass** rule:
     - Policy name: `Allow Public`
     - Action: **Bypass**
     - Selector: **Everyone**
5. Save changes — takes effect within ~30 seconds

## Alternative: Cloudflare Dashboard (Pages)

If the Access policy was set at the Pages project level:

1. Go to **https://dash.cloudflare.com** (main Cloudflare dashboard)
2. Navigate to **Workers & Pages > exel-ai-polling**
3. Click **Settings > General**
4. Look for **Access Policy** section — remove or set to "Allow all"

## Verification

After removing the policy, visit the site in an incognito window:
```
https://exel-ai-polling.explore-096.workers.dev
```
It should load without any email/code prompt.
