# Playwright E2E Tests

## Setup (one-time)

```bash
# Install Playwright + Chromium
npm install -D @playwright/test
npx playwright install chromium

# Install system dependencies (requires sudo)
npx playwright install-deps chromium
# OR manually: sudo apt-get install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2
```

## Run

```bash
# All tests (starts dev server automatically)
npx playwright test

# Specific test file
npx playwright test tests/homepage.spec.ts

# With browser visible (headed mode)
npx playwright test --headed

# Generate HTML report
npx playwright test --reporter=html
```

## Test Coverage

| File | Tests | CRS | What It Tests |
|------|:-----:|-----|---------------|
| homepage.spec.ts | 5 | CRS-01 | Landing page, session code input, Trinity cards, navbar, badge |
| dashboard.spec.ts | 2 | CRS-06 | Moderator dashboard, session list/login |
| divinity-guide.spec.ts | 5 | — | Flower SVG, language selector, portals/library buttons |
| api-page.spec.ts | 1 | — | API documentation page loads |
