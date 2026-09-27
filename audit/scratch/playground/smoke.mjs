import { createRequire } from 'node:module';
import { serve } from '../../playground/test/serve.mjs';
const require = createRequire(new URL('../wasm/package.json', import.meta.url));
const { chromium } = require('playwright-core');
const port = 8800 + Math.floor(Math.random() * 100);
const srv = await serve(port);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
page.on('console', m => console.log('console', m.type(), m.text()));
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => PG.state.trials.length > 0 && PG_TEST.idle(), null, { timeout: 30000 }).catch(e => console.log('wait fail', e.message));
console.log(await page.evaluate(() => ({ n: PG.state.trials.length, status: document.querySelector('#run-status').textContent, mem: document.querySelector('#mem').textContent })));
await page.screenshot({ path: 'shots/smoke-desktop.png' });
for (const v of ['pitch', 'vowel']) { await page.click('#vt-' + v); await page.waitForTimeout(400); await page.screenshot({ path: `shots/smoke-${v}.png`, fullPage: false }); }
await page.click('#tab-params'); await page.waitForTimeout(300); await page.screenshot({ path: 'shots/smoke-params.png' });
await browser.close(); srv.close();
