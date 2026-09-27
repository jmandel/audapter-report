// Screenshot every figure (and optionally whole cards) at desktop and at 390 px in light and dark.
// Usage: node audit/report/figshots.mjs [outdir] [card-id ...]   (default outdir: report/build/figs)
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const R = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(R, '..', 'scratch', 'wasm', 'package.json'));
const { chromium } = require('playwright-core');
const OUT = process.argv[2] || path.join(R, 'build', 'figs'); fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(3);
const url = 'file://' + path.join(R, 'prototype', 'index.html');
const b = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const modes = [['desk', { width: 1280, height: 900 }, 'light'], ['mob', { width: 390, height: 844 }, 'light'], ['mobdark', { width: 390, height: 844 }, 'dark']];
for (const [tag, vp, cs] of modes) {
  const p = await b.newPage({ viewport: vp, colorScheme: cs });
  await p.goto(url);
  const figs = await p.$$('figure.fig');
  for (const f of figs) {
    const id = await f.evaluate(e => (e.closest('article') || e.closest('section')).id);
    if (only.length && !only.includes(id)) continue;
    if (!(await f.isVisible())) continue;
    const n = await f.evaluate(e => [...(e.closest('article') || e.closest('section')).querySelectorAll('figure.fig')].indexOf(e));
    try { await f.screenshot({ path: path.join(OUT, `${id}-${n}-${tag}.png`), animations: 'disabled', timeout: 60000 }); } catch (e) { console.log('SHOT FAILED', id, tag, e.message.split('\n')[0]); }
    const over = await f.evaluate(e => { const r = e.getBoundingClientRect(); return [...e.querySelectorAll('svg')].filter(s => s.getBoundingClientRect().width > 0 && s.getBoundingClientRect().right > r.right + 1).length; });
    if (over) console.log(`OVERFLOW ${id}-${n}-${tag}`);
  }
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  if (sw > vp.width + 1) console.log(`PAGE WIDER THAN VIEWPORT in ${tag}: ${sw}px`);
  await p.close();
}
await b.close();
console.log('figures in', OUT);
