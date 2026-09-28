// Open test cases in the workspace and print what the page shows.
import { createRequire } from 'node:module';
import { serve } from '../../playground/test/serve.mjs';
const require = createRequire(new URL('../wasm/package.json', import.meta.url));
const { chromium } = require('playwright-core');
const port = 8600 + Math.floor(Math.random() * 90), srv = await serve(port);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', deviceScaleFactor: 2 });
page.on('pageerror', e => console.log('pageerror', e.message)); page.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => PG.state.trials.length > 0 && PG_TEST.idle(), null, { timeout: 60000 });
for (const id of process.argv.slice(2)) {
  await page.evaluate(id => { location.hash = 'case=' + id; }, id);
  await page.waitForFunction(id => PG.Cases.current() && PG.Cases.current().id === id && !PG.Cases.running() && Object.keys(PG.Cases.results()).length && PG_TEST.idle(), id, { timeout: 180000 });
  await page.waitForTimeout(500);
  console.log('toasts', await page.evaluate(() => document.getElementById('toasts').textContent), await page.evaluate(() => document.getElementById('run-status').textContent));
  console.log(id, JSON.stringify(await page.evaluate(() => PG_TEST.caseState())));
  console.log(JSON.stringify(await page.evaluate(() => PG.Cases.comparisons().filter(x => !x.ok).map(x => [x.variant, x.label, x.want, x.got]))));
  await (await page.$('#case-banner')).screenshot({ path: `ws390-${id}.png` }); await (await page.$('#v-tiers')).screenshot({ path: `wsv390-${id}.png` });
}
await browser.close(); srv.close();
