// Render check: open the prototype from file:// in headless Chromium, run every in-browser panel,
// capture screenshots (desktop, mobile, dark, print PDF) and any console/page errors.
// Usage: node report/check-render.mjs [outdir]   (needs playwright-core in audit/scratch/wasm/node_modules)
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const R = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(R, '..', 'scratch', 'wasm', 'package.json'));
const { chromium } = require('playwright-core');
const OUT = process.argv[2] || path.join(R, 'build', 'shots');   // report/build is git-ignored
fs.mkdirSync(OUT, { recursive: true });
const url = 'file://' + path.join(R, 'prototype', 'index.html');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
const errs = [];
const shot = async (el, p) => { if (!el) return; try { await el.screenshot({ path: p, animations: 'disabled', timeout: 60000 }); } catch (e) { console.log('shot failed', p, e.message.split('\n')[0]); } };
async function open(opts) {
  const page = await browser.newPage(opts);
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(url); await page.waitForLoadState('load');
  return page;
}

// Playhead mapping check: for every clip mapped to a figure, the playhead at clip time 0 and at the clip's end must fall inside
// the trial box it names, in the panel it names; a clip whose label names a trial must have a mapping (or say why not).
async function playheadCheck(pg, tag) {
  const res = await pg.evaluate(() => [...document.querySelectorAll('li.clip')].map(li => {
    const a = li.querySelector('audio'), lab = li.querySelector('.clip-l').textContent, card = li.closest('article') ? li.closest('article').id : '';
    const m = /\btrial (\d+)/i.exec(lab.split('.')[0] || '');
    if (!a.dataset.sketch) return { card, lab, file: a.getAttribute('src'), mapped: false, named: m ? m[1] : null, nph: !!li.querySelector('.nph') };
    const dur = +a.dataset.dur, p0 = window.AudPlayhead(a, 0), p1 = window.AudPlayhead(a, Math.max(0, dur - 0.005));
    const panel = /-(exp|obs)$/.exec(a.dataset.sketch);
    return { card, lab, file: a.getAttribute('src'), mapped: true, named: m ? m[1] : null, want: a.dataset.trial, panel: panel && panel[1],
             labPanel: /^(Expected|Observed|Input)/.exec(lab) ? /^(Expected|Observed|Input)/.exec(lab)[1] : null, p0, p1 };
  }));
  const bad = [];
  for (const r of res) {
    if (!r.mapped) { if (r.named && !r.nph) bad.push(`${r.card} ${r.file}: label names trial ${r.named} but the clip has no figure mapping`); continue; }
    if (!r.p0 || !r.p1) { bad.push(`${r.card} ${r.file}: mapping does not resolve to a trial box`); continue; }
    const inside = p => p.x >= p.x0 - 0.5 && p.x <= p.x1 + 0.5;
    if (!inside(r.p0) || !inside(r.p1)) bad.push(`${r.card} ${r.file}: playhead ${r.p0.x.toFixed(1)}..${r.p1.x.toFixed(1)} outside trial ${r.p0.trial} box ${r.p0.x0}..${r.p0.x1}`);
    if (r.named && r.named !== r.p0.trial) bad.push(`${r.card} ${r.file}: label says trial ${r.named}, playhead is in trial ${r.p0.trial}`);
    if (r.labPanel === 'Expected' && r.panel !== 'exp' || r.labPanel === 'Observed' && r.panel !== 'obs') bad.push(`${r.card} ${r.file}: label "${r.labPanel}" but mapped to panel ${r.panel}`);
  }
  const n = res.filter(r => r.mapped).length;
  console.log(`playhead check (${tag}): ${n} mapped clips, ${res.length - n} without playhead, ${bad.length} problems`);
  fs.writeFileSync(path.join(OUT, `playheads-${tag}.json`), JSON.stringify(res, null, 1));
  for (const b of bad) errs.push('PLAYHEAD ' + tag + ': ' + b);
}
const p = await open({ viewport: { width: 1280, height: 900 } });
await playheadCheck(p, 'desktop');
// run every live panel, one after another
for (const id of await p.$$eval('.interactive[data-widget]', e => e.map(x => x.dataset.widget))) {
  const sel = `.interactive[data-widget="${id}"]`;
  await p.click(`${sel} button.run`);
  try { await p.waitForFunction(s => /Ran in|Could not/.test(document.querySelector(s + ' .istatus').textContent), sel, { timeout: 120000 }); }
  catch (e) { errs.push(`panel ${id}: timed out; status "${await p.textContent(sel + ' .istatus')}"`); continue; }
  console.log(`panel ${id}:`, await p.textContent(`${sel} .istatus`));
  if (process.env.PANEL_GAP_MS) await p.waitForTimeout(Number(process.env.PANEL_GAP_MS));   // mimic a reader pausing between panels
  console.log('   ', (await p.$$eval(`${sel} .irow`, e => e.map(x => x.querySelector('.ilab').textContent + ': ' + x.querySelector('.ival').textContent))).join(' | '));
}
for (const id of await p.$$eval('article.card', e => e.map(x => x.id)))
  await shot(await p.$(`article.card[id="${id}"]`), path.join(OUT, `card-${id.toLowerCase()}.png`));
await p.screenshot({ path: path.join(OUT, 'top.png') });
await shot(await p.$('#methods'), path.join(OUT, 'methods.png'));
await p.pdf({ path: path.join(OUT, 'print.pdf') }).catch(e => console.log('pdf:', e.message));
const m = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await playheadCheck(m, 'phone');
const mc = await m.$('article.card'); await shot(mc, path.join(OUT, 'mobile-first-card.png'));
await m.screenshot({ path: path.join(OUT, 'mobile-top.png') });
const d = await open({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
for (const f of (await d.$$('article.card .fig')).slice(0, 3)) await shot(f, path.join(OUT, `dark-fig-${(await d.evaluate(e => e.closest('article').id, f)).toLowerCase()}.png`));
const pr = await open({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
await pr.emulateMedia({ media: 'print' }); await pr.pdf({ path: path.join(OUT, 'print-from-dark.pdf') }).catch(e => errs.push('pdf: ' + e.message));
console.log('errors:', errs.length ? errs.join('\n') : 'none');
if (errs.length) process.exitCode = 1;
await browser.close();
