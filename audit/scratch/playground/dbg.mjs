import { createRequire } from 'node:module';
import { serve } from '../../playground/test/serve.mjs';
const require = createRequire(new URL('../wasm/package.json', import.meta.url));
const { chromium } = require('playwright-core');
const port = 8600 + Math.floor(Math.random() * 90), srv = await serve(port);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', e => console.log('pageerror', e.message, e.stack));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console', m.text()); });
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => PG.state.trials.length > 0 && PG_TEST.idle(), null, { timeout: 60000 });
const id = process.argv[2];
await page.evaluate(id => { location.hash = 'case=' + id; }, id);
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(1500);
  const s = await page.evaluate(() => ({ run: PG.Cases.running(), res: Object.fromEntries(Object.entries(PG.Cases.results()).map(([k, v]) => [k, v.length])), trials: PG.state.trials.length, caseTrials: PG.state.trials.filter(t => t.caseRef).length, status: document.getElementById('run-status').textContent, toasts: document.getElementById('toasts').textContent }));
  console.log(JSON.stringify(s));
  if (!s.run && Object.keys(s.res).length) break;
}
console.log(JSON.stringify(await page.evaluate(() => PG.Cases.comparisons().slice(0, 8).map(x => [x.variant, x.label, x.want, x.got]))));
await browser.close(); srv.close();
