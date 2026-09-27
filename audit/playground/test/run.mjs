// Headless test of the built playground (audit/playground/dist) in Chromium with a fake microphone.
//   node audit/playground/test/run.mjs        (after audit/playground/build.sh; needs playwright-core in audit/scratch/wasm
//                                              and Chromium at /usr/bin/chromium or $CHROME)
// 1. Records a trial through the UI from --use-file-for-fake-audio-capture=<corpus wav>, runs it with F1 +20 %, and checks
//    that the logged sfmts/fmts ratio is 1.20 and that the page's output equals the batch API (lib/audapter-lite.js in node)
//    run on the same recorded input with the same setParam list: bit-exact output, fmts and sfmts.
// 2. Runs every kind of setting once (pitch, loudness, timing, delay, noise, OST modes, fields, builds) and checks each returns.
// 3. Runs a sweep and a same-session sequence while sampling the browser's resident memory (peak reported).
// 4. Loads the page from file:// and runs a trial there.
// 5. Screenshots at 1440 px and 390 px, light and dark, into audit/playground/test/shots/.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serve } from './serve.mjs';

const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), A = path.resolve(P, '..');
const require = createRequire(path.join(A, 'scratch', 'wasm', 'package.json'));
const { chromium } = require('playwright-core');
const CHROME = process.env.CHROME || '/usr/bin/chromium';
const WAV = path.join(A, 'corpus', 'audio', 'pvqd_LA9003_a.wav');   // sustained /a/, adult female, CC BY 4.0
const SHOTS = path.join(P, 'test', 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
if (!fs.existsSync(path.join(P, 'dist', 'index.html'))) { console.error('build first: audit/playground/build.sh'); process.exit(2); }
let fails = 0;
const T = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ': ' + detail : ''}`); if (!ok) fails++; };

// resident memory of this process's descendants (the browser and its renderer/worker processes), in MB
function treeRssMB() {
  try {
    const rows = execFileSync('ps', ['-eo', 'pid=,ppid=,rss='], { encoding: 'utf8' }).trim().split('\n').map(l => l.trim().split(/\s+/).map(Number));
    const kids = new Map(); for (const [p, pp] of rows) { if (!kids.has(pp)) kids.set(pp, []); kids.get(pp).push(p); }
    const rss = new Map(rows.map(([p, , r]) => [p, r]));
    let sum = 0; const st = [process.pid];
    while (st.length) { const p = st.pop(); for (const c of kids.get(p) || []) { sum += rss.get(c) || 0; st.push(c); } }
    return sum / 1024;
  } catch { return NaN; }
}
let peakMB = 0, sampling = null;
const startSampling = () => { sampling = setInterval(() => { peakMB = Math.max(peakMB, treeRssMB()); }, 100); };

const port = 8900 + Math.floor(Math.random() * 90);
const srv = await serve(port);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: [
  '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${WAV}`, '--autoplay-policy=no-user-gesture-required'] });
const errors = [];
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...opts });
  await ctx.grantPermissions(['microphone'], { origin: `http://127.0.0.1:${port}` }).catch(() => {});
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return page;
};
const idle = page => page.waitForFunction(() => self.PG_TEST && PG_TEST.idle(), null, { timeout: 60000 });
startSampling();
const baseMB = treeRssMB();

// ---------------- 1. record through the UI, run F1 +20 %, compare with the batch API
const page = await newPage();
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => PG.state.trials.length > 0 && PG_TEST.idle(), null, { timeout: 60000 });   // first clip auto-runs
await page.evaluate(() => PG_TEST.setAutoRun(false));
await page.click('#src-record');
await page.selectOption('select[aria-label="Maximum length"]', '3');
await page.click('#rec-btn');
await page.waitForFunction(() => PG.state.input && PG.state.input.kind === 'mic', null, { timeout: 20000 });
await page.evaluate(() => PG.editSettings(s => { s.shift.formant.on = true; s.shift.formant.units = 'pct'; s.shift.formant.f1 = 20; s.shift.formant.f2 = 0; s.shift.formant.field = 'all'; s.when.mode = 'always'; }));
await page.click('#run-btn');
await idle(page);
const id = await page.evaluate(() => PG.state.currentId);
const tr = await page.evaluate(i => PG_TEST.trial(i), id);
const x = Float64Array.from(tr.input);
const inPeak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
T('microphone recording captured the fake-capture WAV', x.length >= 2.5 * 48000 && inPeak > 0.02, `${(x.length / 48000).toFixed(2)} s at 48 kHz, peak ${inPeak.toFixed(3)}`);
const rat = []; for (let i = 0; i < tr.fmts[0].length; i++) if (tr.sfmts[0][i] > 0 && tr.fmts[0][i] > 0) rat.push(tr.sfmts[0][i] / tr.fmts[0][i]);
rat.sort((a, b) => a - b);
const med = rat[rat.length >> 1];
T('logged sF1/F1 = 1.20 with F1 +20 %', rat.length > 100 && Math.abs(med - 1.2) < 1e-4 && Math.abs(rat[0] - 1.2) < 1e-3 && Math.abs(rat[rat.length - 1] - 1.2) < 1e-3,
  `${rat.length} shifted frames, median ${med.toFixed(6)}, range ${rat[0].toFixed(6)}–${rat[rat.length - 1].toFixed(6)}`);
// the same input through the batch API in node (fresh instance, same setParam list, AudapterWasm.runTrial)
require(path.join(A, 'wasm', 'lib', 'audapter-lite.js'));
const NS = require(path.join(A, 'wasm', 'lib', 'audapter-lite.js'));
const a = await NS.create('lite');
a.setParams(tr.compiled);
const ref = a.runTrial({ input: x, ost: tr.ost || '', pcf: tr.pcf || '' });
let nd = 0, maxd = 0; for (let i = 0; i < ref.output.length; i++) { const d = Math.abs(ref.output[i] - tr.output[i]); if (d) nd++; maxd = Math.max(maxd, d); }
T('page output equals the batch API on the same input (bit-exact)', ref.output.length === tr.output.length && nd === 0, `${tr.output.length} samples, ${nd} differ, max |diff| ${maxd}`);
let fd = 0; for (let k = 0; k < 2; k++) for (let i = 0; i < ref.fmts[k].length; i++) { if (ref.fmts[k][i] !== tr.fmts[k][i]) fd++; if (ref.sfmts[k][i] !== tr.sfmts[k][i]) fd++; }
T('logged fmts and sfmts equal the batch API', fd === 0, `${ref.fmts[0].length} frames, ${fd} values differ`);

// ---------------- 2. every kind of setting runs
const variants = {
  'pitch, phase vocoder +2 st': s => { s.shift.pitch.on = true; },
  'pitch, time domain +1 st, after 0.5 s': s => { s.shift.formant.on = false; s.shift.pitch.on = true; s.shift.pitch.method = 'tds'; s.shift.pitch.semitones = 1; s.when.mode = 'after'; s.when.after = 0.5; },
  'loudness +6 dB in a window': s => { s.shift.loudness.on = true; s.when.mode = 'window'; s.when.after = 0.5; s.when.until = 1.5; },
  'time warp during the vowel': s => { s.shift.formant.on = false; s.shift.timing.on = true; s.when.mode = 'vowel'; },
  'delay 150 ms': s => { s.shift.delay.on = true; s.shift.delay.ms = 150; },
  'speech + 3 s noise (I-01 gap)': s => { s.hear.fb = 3; s.hear.noise.seconds = 3; },
  'F2 −200 Hz in a region': s => { s.shift.formant.units = 'hz'; s.shift.formant.f1 = 0; s.shift.formant.f2 = -200; s.shift.formant.field = 'region'; },
  'F2-dependent field': s => { s.shift.formant.field = 'curve'; },
  'painted 2-D field': s => { s.shift.formant.field = 'painted'; for (let i = 6; i < 14; i++) for (let j = 8; j < 16; j++) s.shift.formant.painted.cells.push([i, j, 20, 0]); },
  'mel units': s => { s.shift.formant.units = 'mel'; s.shift.formant.f1 = 100; },
  'custom OST/PCF, 3 rows': s => { s.when.mode = 'custom'; s.when.ost = 'rmsSlopeWin = 0.030000\n\nn = 2\n0 ELAPSED_TIME 0.5 NaN {}\n1 OST_END NaN NaN {}\n\nn = 0\n'; s.when.pcf = '0\n\n2\n0, 0, 0, 0, 0\n1, 0, 0, 0.3, 0\n'; },
  'child preset': s => { s.preset = 'child'; },
  'low voice preset, patched build': s => { s.preset = 'lowvoice'; s.build = 'patched'; },
  'full-size build': s => { s.build = 'full'; },
};
for (const [name, fn] of Object.entries(variants)) {
  const r = await page.evaluate(async src => {
    const fn = eval(src); PG.setSettings(PG.S.defaultSettings(), 'noauto'); PG.editSettings(fn, 'noauto');
    const tid = await PG_TEST.runAndWait(true); const t = PG.trial(tid);
    if (!t || !t.result) return { ok: false };
    const r = t.result; return { ok: true, n: r.fmts[0].length, shifted: r.sfmts[0].filter(v => v > 0).length, ms: r.info.processMs, variant: r.info.variant, peak: r.analysis.outPeak, states: [...new Set(r.ost_stat)].join(',') };
  }, fn.toString());
  T(`runs: ${name}`, r.ok, r.ok ? `${r.variant}, ${r.n} frames, ${r.shifted} shifted, OST states ${r.states}, ${r.ms.toFixed(0)} ms` : 'no result');
}

// ---------------- 3. sweep + same-session sequence, memory
const beforeMB = treeRssMB();
await page.evaluate(() => { PG.setSettings(PG.S.defaultSettings(), 'noauto'); PG.bus.emit('sweep', { control: PG.controlByPath('shift.formant.f1'), values: [0, 10, 20, 30, 40] }); });
await page.waitForTimeout(500); await idle(page);
await page.waitForFunction(() => PG.state.selected.size === 5 && PG_TEST.idle(), null, { timeout: 60000 });
const sw = await page.evaluate(() => [...PG.state.selected].map(i => { const t = PG.trial(i), r = t.result, v = []; for (let k = 0; k < r.fmts[0].length; k++) if (r.sfmts[0][k] > 0) v.push(r.sfmts[0][k] / r.fmts[0][k]); v.sort((a, b) => a - b); return v.length ? +v[v.length >> 1].toFixed(4) : 1; }));
T('sweep of F1 over 0, 10, 20, 30, 40 % logs those ratios', JSON.stringify(sw) === JSON.stringify([1, 1.1, 1.2, 1.3, 1.4]), JSON.stringify(sw));
await page.screenshot({ path: path.join(SHOTS, 'compare-sweep-1440-light.png') });
const seq = await page.evaluate(async () => {
  const ids = [...PG.state.selected].slice(0, 3); PG.state.selected.clear();
  PG.bus.emit('run-sequence', ids);
  await new Promise(r => setTimeout(r, 300));
  while (!PG_TEST.idle()) await new Promise(r => setTimeout(r, 100));
  const s = PG.state.trials.filter(t => t.seq); return { n: s.length, sameSession: new Set(s.map(t => t.seq.id)).size === 1 };
});
T('three trials run as one Audapter session', seq.n === 3 && seq.sameSession, JSON.stringify(seq));
const stats = await page.evaluate(() => PG_TEST.stats());
await page.screenshot({ path: path.join(SHOTS, 'compare-session-1440-light.png') });
T('fresh trials use one instance at a time (workers terminated)', stats.instancesCreated >= 5 && stats.peakWasmBytes < 200 * 1048576 * 2,
  `${stats.instancesCreated} instances created, WASM heap per instance ${(stats.lastWasmBytes / 1048576).toFixed(0)} MB (full-size build ${(stats.peakWasmBytes / 1048576).toFixed(0)} MB)`);
const afterMB = treeRssMB(), phase13Peak = peakMB;

// ---------------- 4. file://
const fpage = await newPage();
await fpage.goto(pathToFileURL(path.join(P, 'dist', 'index.html')).href);
const fileOk = await fpage.waitForFunction(() => PG.state.trials.length > 0 && PG_TEST.idle(), null, { timeout: 60000 }).then(() => true).catch(() => false);
const fmode = await fpage.evaluate(() => PG.Engine.stats.mode).catch(() => '?');
T('works from file:// (clip loads, trial runs)', fileOk, `engine mode: ${fmode}`);
await fpage.context().close();

// ---------------- 5. screenshots: 1440 and 390 px, light and dark
async function shots(width, scheme) {
  const p = await newPage({ viewport: { width, height: width < 600 ? 844 : 1000 }, colorScheme: scheme, deviceScaleFactor: width < 600 ? 2 : 1 });
  await p.goto(`http://127.0.0.1:${port}/`);
  await p.waitForFunction(() => PG.state.trials.length > 0 && PG_TEST.idle(), null, { timeout: 60000 });
  await p.evaluate(() => { PG_TEST.setAutoRun(false); PG.editSettings(s => { s.shift.pitch.on = true; s.shift.pitch.semitones = 2; }, 'noauto'); });
  await p.evaluate(() => PG_TEST.runAndWait(true));
  const tag = `${width}-${scheme}`;
  const results = await p.$('#results');
  for (const v of ['spectro', 'pitch', 'vowel']) {
    await p.click('#vt-' + v); await p.waitForTimeout(350);
    if (width < 600) await results.screenshot({ path: path.join(SHOTS, `${v}-${tag}.png`) });
    else await p.screenshot({ path: path.join(SHOTS, `${v}-${tag}.png`) });
  }
  if (width < 600) { await p.click('#vt-spectro'); await p.screenshot({ path: path.join(SHOTS, `top-${tag}.png`) }); }
  await p.evaluate(() => PG.editSettings(s => { s.when.mode = 'vowel'; s.when.onDelay = 0.1; s.shift.loudness.on = true; }, 'noauto'));
  await p.click('#tab-params'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(SHOTS, `params-${tag}.png`) });
  await p.context().close();
}
for (const w of [1440, 390]) for (const sc of ['light', 'dark']) await shots(w, sc);
clearInterval(sampling);
T('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
console.log(`memory (resident, whole headless browser): ${baseMB.toFixed(0)} MB at start; peak ${phase13Peak.toFixed(0)} MB over parts 1-3 (one page: about 20 trials incl. the 310 MB full-size build, a 5-value sweep, a 3-trial session); ${beforeMB.toFixed(0)} MB before and ${afterMB.toFixed(0)} MB after the sweep and session; peak ${peakMB.toFixed(0)} MB overall (screenshots open a second page)`);
console.log(`screenshots: ${fs.readdirSync(SHOTS).filter(f => f.endsWith('.png')).length} in ${path.relative(A, SHOTS)}`);
await browser.close(); srv.close();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exitCode = fails ? 1 : 0;
