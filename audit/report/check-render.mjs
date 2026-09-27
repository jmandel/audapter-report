// Render check: open the prototype from file:// in headless Chromium, run the OST-F1 in-browser panel,
// capture screenshots (desktop, mobile, dark, print PDF) and any console/page errors.
// Usage: node report/check-render.mjs [outdir]   (needs playwright-core in audit/scratch/wasm/node_modules)
import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const R = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(R, '..', 'scratch', 'wasm', 'package.json'));
const { chromium } = require('playwright-core');
const OUT = process.argv[2] || path.join(process.env.HOME, 'hobby/.agent-scratch/report-shots');
const url = 'file://' + path.join(R, 'prototype', 'index.html');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
const errs = [];
async function open(opts) {
  const page = await browser.newPage(opts);
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(url); await page.waitForLoadState('load');
  return page;
}
const p = await open({ viewport: { width: 1280, height: 900 } });
await p.click('.interactive[data-widget="ost-f1"] button.run');
await p.waitForFunction(() => /Ran 3 trials|Could not/.test(document.querySelector('.interactive .istatus').textContent), null, { timeout: 60000 });
console.log('widget:', await p.textContent('.interactive .istatus'));
console.log('rows:', (await p.$$eval('.irow .ival', e => e.map(x => x.textContent))).join(' | '));
await (await p.$('#OST-F1')).screenshot({ path: path.join(OUT, 'card-ost-f1.png') });
await (await p.$('#I-01')).screenshot({ path: path.join(OUT, 'card-i-01.png') });
await (await p.$('#PT-5')).screenshot({ path: path.join(OUT, 'card-pt-5.png') });
await p.screenshot({ path: path.join(OUT, 'top.png') });
await (await p.$('#method')).screenshot({ path: path.join(OUT, 'method.png') });
await p.pdf({ path: path.join(OUT, 'print.pdf') }).catch(e => console.log('pdf:', e.message));
const m = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await (await m.$('#OST-F1')).screenshot({ path: path.join(OUT, 'mobile-ost-f1.png') });
const d = await open({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
await (await d.$('#PT-5 .fig')).screenshot({ path: path.join(OUT, 'dark-pt-5-fig.png') });
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close();
