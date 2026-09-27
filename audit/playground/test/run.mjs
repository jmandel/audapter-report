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

// ---------------- 2b. Timing & design: every template on a bundled sentence; predicted vs logged on-times
await page.evaluate(() => PG.InputUI.loadClip('arctic_slt_a0030'));
await page.waitForFunction(() => PG.state.input && PG.state.input.clipId === 'arctic_slt_a0030');
await page.evaluate(() => PG.setSettings(PG.S.defaultSettings(), 'noauto'));
await page.click('#tab-design');
const designReady = () => page.waitForFunction(() => PG.DesignUI.state().dry && PG_TEST.idle() && document.querySelector('.dz-timeline .tiers'), null, { timeout: 60000 });
await designReady();
const tplNames = await page.evaluate(() => Object.entries(PG.S.TEMPLATES).map(([k, t]) => [k, t.label]));
for (const [key, label] of tplNames) {
  await page.click(`button.tpl:has-text("${label}")`);
  await page.waitForTimeout(200); await designReady();
  const tid = await page.evaluate(() => PG_TEST.runAndWait(true));
  await designReady();
  const r = await page.evaluate(id => ({ chk: PG_TEST.designCheck(id), summary: PG.trial(id).summary, sounds: PG.DesignUI.sounds().map(z => [+z.on.toFixed(3), +z.off.toFixed(3)]) }), tid);
  const c = r.chk;
  const ok = c && c.stateMis === 0 && c.onMis === 0 && c.shiftOutside === 0 && c.shiftIn === c.trackedIn && (key === 'nth' || c.predOn > 0);
  T(`template "${label}": predicted on-times equal the logged ones`, ok,
    c ? `${r.summary}; predicted spans ${JSON.stringify(c.spans)}; ${c.stateMis} of ${c.n} frames differ in OST state, ${c.onMis} in on/off; formants shifted on ${c.shiftIn} of the ${c.trackedIn} tracked frames inside, ${c.shiftOutside} outside` : 'no prediction');
  if (key === 'step') await page.screenshot({ path: path.join(SHOTS, 'design-1440-light.png'), fullPage: false });
}
// drag the start edge of the "sudden step" block onto sound 2's onset: it must snap to that event
await page.click('button.tpl:has-text("Sudden step after voice onset")'); await designReady();
const geo = await page.evaluate(() => {
  const cv = document.querySelectorAll('.dz-timeline canvas.tier-c')[2], r = cv.getBoundingClientRect(), z = PG.Tiers.zoom;
  const snd = PG.DesignUI.sounds(), iv = PG.DesignUI.intended(snd, z.dur)[0];
  const X = t => r.left + (t - z.t0) / (z.t1 - z.t0) * r.width;
  return { y: r.top + r.height / 2, from: X(iv.a), to: X(snd[1].on + 0.01), on2: snd[1].on };
});
await page.mouse.move(geo.from, geo.y); await page.mouse.down(); await page.mouse.move((geo.from + geo.to) / 2, geo.y, { steps: 4 }); await page.mouse.move(geo.to, geo.y, { steps: 4 }); await page.mouse.up();
await page.waitForTimeout(300); await designReady();
const dragged = await page.evaluate(() => PG.state.settings.design.blocks[0].start);
T('dragging the block start onto sound 2 snaps it to "sound 2 starts"', dragged.ev === 'on' && dragged.k === 2, JSON.stringify(dragged) + `, sound 2 onset ${geo.on2.toFixed(3)} s`);
await page.screenshot({ path: path.join(SHOTS, 'design-dragged-1440-light.png') });
// a hand-made two-block design (step, then a larger step later) through the block editor model
const two = await page.evaluate(async () => {
  PG.editSettings(s => { s.when.mode = 'design'; s.design.template = 'custom'; s.design.blocks = [
    { start: { ev: 'on', k: 1, ms: 100 }, end: { ev: 'dur', k: 1, ms: 200 }, what: { f1: 10, f2: 0, st: 0, db: 0 } },
    { start: { ev: 'off', k: 1, ms: 0 }, end: { ev: 'off', k: 2, ms: 0 }, what: { f1: 0, f2: -15, st: 1, db: 3 } }]; }, 'noauto');
  await new Promise(r => setTimeout(r, 300)); while (!PG_TEST.idle()) await new Promise(r => setTimeout(r, 100));
  const id = await PG_TEST.runAndWait(true); while (!PG_TEST.idle()) await new Promise(r => setTimeout(r, 100));
  return PG_TEST.designCheck(id);
});
T('two-block design (F1 step, then F2, pitch and level in sound 2): predicted equals logged', two && two.stateMis === 0 && two.onMis === 0 && two.shiftOutside === 0, JSON.stringify(two && { spans: two.spans, stateMis: two.stateMis, onMis: two.onMis, shiftOutside: two.shiftOutside }));
// schedule: 2 baseline, 3 ramp, 2 hold, 2 washout with "sudden step after voice onset"
await page.click('button.tpl:has-text("Sudden step after voice onset")'); await designReady();
await page.fill('input[aria-label="Block 1 F1"]', '20'); await page.dispatchEvent('input[aria-label="Block 1 F1"]', 'change'); await designReady();
for (const [k, v] of [['base', 2], ['ramp', 3], ['hold', 2], ['wash', 2], ['catchPct', 0]]) { await page.fill('#sch-' + k, String(v)); await page.dispatchEvent('#sch-' + k, 'change'); }
await page.click('#sch-run');
await page.waitForFunction(() => PG.state.trials.filter(t => t.sched).length >= 9 && PG_TEST.idle(), null, { timeout: 120000 });
const sch = await page.evaluate(() => PG.state.trials.filter(t => t.sched).sort((a, b) => a.sched.n - b.sched.n).map(t => { const m = PG.DesignUI.trialMeasure(t); return [t.sched.phase, +t.sched.factor.toFixed(3), +(m.heard / m.prod).toFixed(4)]; }));
const want = [0, 0, 1 / 3, 2 / 3, 1, 1, 1, 0, 0].map(f => +(1 + 0.2 * f).toFixed(4));
const schMeas = await page.evaluate(() => PG.state.trials.filter(t => t.sched).sort((a, b) => a.sched.n - b.sched.n).map(t => { const m = PG.DesignUI.trialMeasure(t); return { phase: t.sched.phase, prod: m.prod, heard: m.heard, meas: m.meas, pairs: m.pairs }; }));
const measOk = schMeas.every(m => Number.isFinite(m.meas) && Math.abs(m.meas / m.heard - 1) < 0.04);
T('schedule plot: output measured with the same LPC on input and output sits on produced (baseline, washout) and near the target (ramp, hold), within 4 %', measOk,
  schMeas.map(m => `${m.phase} ${m.prod.toFixed(0)}/${m.heard.toFixed(0)}/${Number.isFinite(m.meas) ? m.meas.toFixed(0) : '–'} (${m.pairs})`).join(', ') + ' (produced/target/measured Hz, paired frames)');
T('schedule 2 baseline / 3 ramp / 2 hold / 2 washout: heard F1 / produced F1 per trial', sch.length === 9 && sch.every((x, i) => Math.abs(x[2] - want[i]) < 2e-3), JSON.stringify(sch));
await page.evaluate(() => document.getElementById('schedule').scrollIntoView());
await page.screenshot({ path: path.join(SHOTS, 'schedule-1440-light.png') });
await page.click('#panel-design button.linkish:has-text("Expert: all 87")');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(SHOTS, 'expert-1440-light.png') });
await page.keyboard.press('Escape');
await page.click('#tab-explore');

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
  await p.click('#tab-design');
  await p.waitForFunction(() => PG.DesignUI.state().dry && PG_TEST.idle() && document.querySelector('.dz-timeline .tiers'), null, { timeout: 60000 });
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(SHOTS, `design-top-${tag}.png`) });
  await p.evaluate(() => document.querySelector('.dz-timeline').scrollIntoView());
  await p.screenshot({ path: path.join(SHOTS, `design-timeline-${tag}.png`) });
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
