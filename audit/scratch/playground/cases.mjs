// Replay every Playground test case in headless Chromium and print card vs replay.
import { createRequire } from 'node:module';
import { serve } from '../../playground/test/serve.mjs';
const require = createRequire(new URL('../wasm/package.json', import.meta.url));
const { chromium } = require('playwright-core');
const port = 8700 + Math.floor(Math.random() * 90), srv = await serve(port);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => PG.state.trials.length > 0 && PG_TEST.idle(), null, { timeout: 60000 });
await page.evaluate(() => PG_TEST.setAutoRun(false));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => PG.CASES.filter(c => c.available).map(c => c.id));
for (const id of ids) {
  const t0 = Date.now();
  await page.evaluate(id => { location.hash = 'case=' + id; }, id);
  await page.waitForFunction(id => PG.Cases.current() && PG.Cases.current().id === id && !PG.Cases.running() && Object.keys(PG.Cases.results()).length, id, { timeout: 180000 });
  const C = await page.evaluate(() => PG.Cases.comparisons().map(x => ({ l: x.label, v: x.variant, want: x.want, got: x.got, ok: x.ok })));
  console.log(`== ${id}: ${C.filter(x => x.ok).length}/${C.length} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  for (const x of C) if (!x.ok) console.log(`   ${x.v} ${x.l}: card ${x.want} replay ${x.got}`);
}
await browser.close(); srv.close();
