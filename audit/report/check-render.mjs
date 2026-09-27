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
// run every live panel, one after another
for (const id of await p.$$eval('.interactive[data-widget]', e => e.map(x => x.dataset.widget))) {
  const sel = `.interactive[data-widget="${id}"]`;
  await p.click(`${sel} button.run`);
  await p.waitForFunction(s => /Ran in|Could not/.test(document.querySelector(s + ' .istatus').textContent), sel, { timeout: 120000 });
  console.log(`panel ${id}:`, await p.textContent(`${sel} .istatus`));
  console.log('   ', (await p.$$eval(`${sel} .irow`, e => e.map(x => x.querySelector('.ilab').textContent + ': ' + x.querySelector('.ival').textContent))).join(' | '));
}
for (const id of await p.$$eval('article.card', e => e.map(x => x.id)))
  await (await p.$(`article.card[id="${id}"]`)).screenshot({ path: path.join(OUT, `card-${id.toLowerCase()}.png`) });
await p.screenshot({ path: path.join(OUT, 'top.png') });
await (await p.$('#method')).screenshot({ path: path.join(OUT, 'method.png') });
await p.pdf({ path: path.join(OUT, 'print.pdf') }).catch(e => console.log('pdf:', e.message));
const m = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await (await m.$('#OST-F1')).screenshot({ path: path.join(OUT, 'mobile-ost-f1.png') });
const d = await open({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
await (await d.$('#PT-5 .fig')).screenshot({ path: path.join(OUT, 'dark-pt-5-fig.png') });
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close();
