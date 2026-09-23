// Prove the class: a 30x-throttled CPU (a cold runner) still gets a green DRAW_COMPLETES, decided when the frame lands.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('public');
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(b); }); });
await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const port = srv.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
for (const rate of [1, 30]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${port}/drone-2525/play.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof state !== 'undefined' && (state.outcomes || []).some((x) => x.id === 'DRAW_COMPLETES') && (state.outcomes || []).some((x) => x.id === 'ASM_MARKED_BY_THE_LOOP'), null, { timeout: 90000 });
  const r = await page.evaluate(() => ({ rows: (state.outcomes || []).filter((x) => x.id === 'DRAW_COMPLETES' || x.id === 'ASM_MARKED_BY_THE_LOOP').map((x) => x.id + ' ' + (x.ok ? 'OK' : 'NO') + ' · ' + x.note), qa: state.qa.pass + '/' + state.qa.total }));
  console.log(`cpu ×${rate} · ${Date.now() - t0} ms wall · ${r.qa}`); r.rows.forEach((x) => console.log('  ' + x));
  await page.close();
}
await browser.close(); srv.close();
