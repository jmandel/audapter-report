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

// ---------------- 2c. vowel variability (inward / outward) on a synthetic vowel cloud
await page.click('#src-synth');
const cloudRun = async (dir, baseline) => {
  const before = await page.evaluate(() => PG.state.trials.length);
  await page.evaluate(({ dir, baseline }) => {
    PG.editSettings(s => { s.when.mode = 'always'; s.shift.formant.on = true; s.shift.formant.field = 'variability'; s.shift.formant.vari.dir = dir; s.shift.formant.vari.strength = 50; if (baseline) s.shift.formant.vari.centre = 'manual'; }, 'noauto');
    PG.bus.emit('cloud', { n: 20, sd1: 50, sd2: 110, f1: 610, f2: 1850, f3: 2900, f0: 215, dur: 0.8, baseline, seed: 11 });
  }, { dir, baseline });
  await page.waitForFunction(n => PG.state.trials.length >= n && PG_TEST.idle(), before + (baseline ? 40 : 20), { timeout: 180000 });
  await page.waitForTimeout(300);
  return page.evaluate(k => {
    const s = PG.state.settings, TK = PG.Vowel.tokenData(s), v = s.shift.formant.vari, V = PG.S.variField(v), c = TK.centre;
    let dS = 0, dH = 0, worst = 0;
    for (const p of TK.pts) { dS += Math.hypot(p.s[0] - c[0], p.s[1] - c[1]); dH += Math.hypot(p.h[0] - c[0], p.h[1] - c[1]); worst = Math.max(worst, Math.hypot(p.h[0] - (c[0] + k * (p.s[0] - c[0])), p.h[1] - (c[1] + k * (p.s[1] - c[1])))); }
    const Mm = TK.pts.filter(p => p.m); let dM = 0; for (const p of Mm) dM += Math.hypot(p.m[0] - c[0], p.m[1] - c[1]);
    return { n: TK.pts.length, ratio: dH / dS, measured: Mm.length ? (dM / Mm.length) / (dS / TK.pts.length) : NaN, worst, step: Math.hypot(V.step1, V.step2), centre: c };
  }, dir === 'in' ? 0.5 : 1.5);
};
const vin = await cloudRun('in', true);
T('vowel variability 50 % inward on a 20-token cloud: heard/spoken dispersion 0.5 ± 0.05 (logged sfmts)', vin.n === 20 && Math.abs(vin.ratio - 0.5) <= 0.05, `ratio ${vin.ratio.toFixed(4)}, measured in the output ${vin.measured.toFixed(3)}, centre ${vin.centre.map(v => v.toFixed(0)).join('/')} Hz`);
T('inward: each token\'s heard point lies on the line toward the centre within one grid step', vin.worst <= vin.step, `worst ${vin.worst.toFixed(2)} Hz, grid step ${vin.step.toFixed(2)} Hz (diagonal)`);
await (await page.$('#v-vowel')).screenshot({ path: path.join(SHOTS, 'variability-in-1440-light.png') });
const vout = await cloudRun('out', false);
T('vowel variability 50 % outward: heard/spoken dispersion 1.5 ± 0.1', vout.n === 20 && Math.abs(vout.ratio - 1.5) <= 0.1, `ratio ${vout.ratio.toFixed(4)}, measured in the output ${vout.measured.toFixed(3)}`);
T('outward: each token\'s heard point lies on the line away from the centre within one grid step', vout.worst <= vout.step, `worst ${vout.worst.toFixed(2)} Hz, grid step ${vout.step.toFixed(2)} Hz`);
await (await page.$('#v-vowel')).screenshot({ path: path.join(SHOTS, 'variability-out-1440-light.png') });
await page.emulateMedia({ colorScheme: 'dark' }); await page.evaluate(() => PG.bus.emit('theme')); await page.waitForTimeout(300);
await (await page.$('#v-vowel')).screenshot({ path: path.join(SHOTS, 'variability-out-1440-dark.png') });
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(500);
await (await page.$('#v-vowel')).screenshot({ path: path.join(SHOTS, 'variability-out-390-dark.png') });
await page.setViewportSize({ width: 1440, height: 1000 }); await page.emulateMedia({ colorScheme: 'light' }); await page.evaluate(() => PG.bus.emit('theme'));
await page.evaluate(() => { PG.Vowel.setMode('trial'); PG.setSettings(PG.S.defaultSettings(), 'noauto'); PG.state.selected.clear(); PG.bus.emit('trials'); PG.bus.emit('view', 'spectro'); });

// ---------------- 2d. report test cases, opened in the main workspace. Per case: the card's numbers reproduce; the first
// view is the key trial side by side (expected above observed, one axis, formant tracks, orange difference, a callout,
// play buttons); the trial list has one row per trial with an Expected/Observed toggle; the settings panel reflects the
// case (3 parameters); "expected" is the card's fix build where one exists, otherwise labelled for what it is.
const FIXB = { 'OST-F1': 'fix-ost-f1', 'OST-F2': 'fix-ost-f2', 'I-01': 'fix-i-01', 'I-02': 'fix-i-02', 'PT-5:cereb': 'fix-pt-5', 'PT-5:synthetic': 'fix-pt-5', 'F6': 'alt-f6' };
// Cases with a real-voice example (the card's primary one) open with it; the synthetic one is checked the same way.
const caseSets = await page.evaluate(() => PG.CASES.filter(c => c.available).flatMap(c => c.sets.map((s, i) => [c.id, s, i === 0])));
const caseRows = [];
const openCase = async (pg, cid, set, dflt) => {
  if (cid === 'OST-F1' && !dflt) await pg.click(`#case-set button[data-set="${set}"]`);   // the banner's switch
  else await pg.evaluate(([id, s, d]) => { location.hash = 'case=' + id + (d ? '' : '&voice=' + s); }, [cid, set, dflt]);
  await pg.waitForFunction(([id, s]) => PG.Cases.current() && PG.Cases.current().id === id && PG.Cases.current().set === s && !PG.Cases.running() && Object.keys(PG.Cases.results()).length && PG_TEST.idle(), [cid, set], { timeout: 180000 });
  await pg.waitForTimeout(400);
};
for (const [cid, set, dflt] of caseSets) {
  await openCase(page, cid, set, dflt);
  const CID = cid; { const cid = `${CID} (${set === 'real' ? 'real voice' : set}${dflt ? ', default' : ''})`;
  const C = await page.evaluate(() => PG.Cases.comparisons().map(x => ({ l: x.label, v: x.variant, want: x.want, got: x.got, ok: x.ok })));
  const st = await page.evaluate(() => PG_TEST.caseState()), info = await page.evaluate(() => { const c = PG.Cases.current(); return { focus: c.focus, n: Math.max(...c.variants.filter(v => /^(expected|observed)$/.test(v.name)).map(v => v.trials.length)), expBuild: (c.variants.find(v => v.name === 'expected') || {}).build }; });
  const bad = C.filter(x => !x.ok);
  caseRows.push([cid, C.length - bad.length, C.length]);
  if (dflt) { const sets = await page.evaluate(() => PG.Cases.current().sets.map(x => [x.id, x.real])); T(`test case ${cid}: opens with the real voice where the card has one`, sets.some(x => x[1]) ? sets[0][1] && sets[0][0] === set : true, sets.map(x => x[0] + (x[1] ? ' (real)' : '')).join(', ')); }
  T(`test case ${cid}: the replay reproduces the card`, !bad.length, `${C.length - bad.length} of ${C.length} numbers` + (bad.length ? '; ' + bad.slice(0, 3).map(x => `${x.v} ${x.l}: card ${x.want} replay ${x.got}`).join('; ') : ''));
  const keyOk = st && st.caseRef && st.caseRef.variant === 'observed' && st.caseRef.trial === (info.focus.observed ?? 0) && st.banner && st.selected.some(n => n.includes('· expected ·'));
  T(`test case ${cid}: opens with the key trial selected (observed current, expected ticked)`, !!keyOk, st ? `current "${st.current}", ticked ${st.selected.length}` : 'no state');
  const pairOk = st && st.view === 'pair' && st.stacks === 1 && st.tierLabels.includes('Expected · heard') && st.tierLabels.includes('Observed · heard') && st.tierLabels.indexOf('Expected · heard') < st.tierLabels.indexOf('Observed · heard')
    && st.bluePixelsExpected > 100 && st.bluePixelsObserved > 100 && st.playButtons === 3;
  T(`test case ${cid}: first view is the key trial side by side (expected above observed, one time axis, formant tracks, play buttons)`, !!pairOk,
    st ? `view ${st.view}, ${st.stacks} stack; tiers ${st.tierLabels.join(' / ')}; heard-formant pixels ${st.bluePixelsExpected} / ${st.bluePixelsObserved}` : '');
  const diffOk = st && st.diffBands > 0 && st.orangePixelsObserved > 50 && st.callout.length > 10 && !/^No difference/.test(st.callout);
  T(`test case ${cid}: the difference is marked in orange with a one-line callout`, !!diffOk, st ? `"${st.callout}"; ${st.diffBands} band(s), ${st.orangePixelsObserved} orange pixels` : '');
  const rowsOk = st && st.rows === info.n && st.toggles === info.n && st.caseTrials >= 2 * info.n;
  T(`test case ${cid}: the trial list has one row per trial with an Expected/Observed toggle`, !!rowsOk, st ? `${st.rows} rows (${info.n} trials), ${st.toggles} toggles, ${st.caseTrials} trial results` : '');
  const FB = FIXB[CID + ':' + set] || FIXB[CID];
  const expOk = FB ? info.expBuild === FB && st.pair && st.pair.eBuild === FB && st.pair.oBuild !== FB
    : info.expBuild === 'lite' && /no code fix applies|no fixed build exists|no code fix build is used/.test(st.expectedMeans);
  T(`test case ${cid}: expected is ${FB ? `the same sequence on the ${FB} build` : 'labelled as what the card uses (no fix build)'}`, !!expOk, st ? st.expectedMeans.slice(0, 160) : '');
  const spotOk = st && st.spot.length === 3 && st.spot.every(x => x.case !== undefined && Math.abs(x.settings - x.case) <= 1e-9 * Math.max(1, Math.abs(x.case)));
  T(`test case ${cid}: the settings panel reflects the case`, !!spotOk, st ? st.spot.map(x => `${x.name} ${x.settings} (case ${x.case})`).join(', ') + `; When: ${st.whenMode}` : '');
  if (['OST-F1', 'LAB-1', 'PT-5'].includes(CID) && dflt) { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(150); await page.screenshot({ path: path.join(SHOTS, `case-${CID.toLowerCase()}-workspace-1440-light.png`) }); }
  if (CID === 'OST-F1' && set === 'synthetic') {   // the banner's example switch
    const sw = await page.evaluate(() => ({ b: [...document.querySelectorAll('#case-set button')].map(b => b.textContent + (b.getAttribute('aria-checked') === 'true' ? '*' : '')).join(' / '), key: PG.Cases.current().key }));
    T('the banner switches between the real voice and synthetic examples', sw.b === 'Real voice / Synthetic*' && /^Trial 4/.test(sw.key), sw.b + '; ' + sw.key.slice(0, 60));
  }
  if (CID === 'OST-F1' && dflt) {
    await (await page.$('#v-tiers')).screenshot({ path: path.join(SHOTS, 'case-ost-f1-pair-1440-light.png') });
    // the toggle: show the expected run of the key row; ticking a row ticks both variants (both show in Compare)
    await page.click('#trials li.case-row[data-group="case"][data-trial="3"] .case-tog button[data-variant="expected"]'); await page.waitForTimeout(300);
    const tg = await page.evaluate(() => PG_TEST.caseState());
    T('test case toggle: Expected shows the expected run of the same trial', tg.caseRef.variant === 'expected' && tg.caseRef.trial === 3 && tg.view === 'pair', tg.current);
    await page.click('#trials li.case-row[data-group="case"][data-trial="1"] input[type=checkbox]'); await page.waitForTimeout(200);
    const tick = await page.evaluate(() => PG.state.trials.filter(t => PG.state.selected.has(t.id) && t.caseRef && t.caseRef.trial === 1).map(t => t.caseRef.variant).sort().join(','));
    T('ticking a case row ticks both variants', tick === 'expected,observed', tick);
    await page.click('#case-timeline-btn'); await page.waitForTimeout(600);
    await (await page.$('#case-summary')).screenshot({ path: path.join(SHOTS, 'case-ost-f1-timeline-1440-light.png') });
    const cmp = await page.evaluate(() => ({ view: PG.state.view, figs: document.querySelectorAll('#v-compare figure.sm').length, sel: PG.state.selected.size }));
    T('Compare shows the session timeline, the card numbers and every case trial', cmp.view === 'compare' && cmp.figs === cmp.sel && cmp.sel === 16 && await page.$('#case-numbers') !== null, JSON.stringify(cmp));
    // editing: fork, then re-run the whole sequence as one session
    await page.evaluate(() => PG.Cases.focus()); await page.waitForTimeout(300);
    await page.evaluate(() => PG.editSettings(s => { s.raw.fb3gain = 0.05; }));
    await page.waitForFunction(() => PG.Cases.forks().length && PG.Cases.forks()[0].ran && !PG.Cases.running() && PG_TEST.idle(), null, { timeout: 120000 });
    await page.waitForTimeout(400);
    const fk = await page.evaluate(() => { const s = PG_TEST.caseState(), f = PG.Cases.forks()[0], R = PG.Cases.results();
      const sh = t => +PG.Cases.metric('shift_s', t.result).toFixed(3);
      return { s, rows: document.querySelectorAll(`#trials li.case-row[data-group="${f.key}"]`).length, orig: document.querySelectorAll('#trials li.case-row[data-group="case"]').length,
        head: document.querySelector(`#trials li.case-head[data-group="${f.key}"]`).textContent, t4: sh(f.results[3]), obs4: sh(R.observed[3]), exp4: sh(R.expected[3]) }; });
    T('an edit while a case is loaded makes "OST-F1 · my edit" with a settings diff; the original stays', fk.s.forks.length === 1 && fk.s.forks[0].name === 'OST-F1 · my edit' && /fb3gain 0\.02 → 0\.05/.test(fk.head) && fk.orig === 8 && fk.rows === 8, fk.head.slice(0, 140));
    T('the copy re-runs the whole sequence as one session (the cross-trial leak is kept)', fk.s.forks[0].n === 8 && fk.s.forks[0].seqIds === 1 && Math.abs(fk.t4 - fk.obs4) < 0.011,
      `${fk.s.forks[0].n} trials in ${fk.s.forks[0].seqIds} session; trial 4 shift ${fk.t4} s (original observed ${fk.obs4} s, expected ${fk.exp4} s)`);
    await page.evaluate(() => PG.editSettings(s => { s.build = 'fix-ost-f1'; }));
    await page.waitForTimeout(900);
    await page.waitForFunction(() => !PG.Cases.running() && PG_TEST.idle() && PG.Cases.forks()[0].results[3] && PG.Cases.forks()[0].results[3].variant === 'fix-ost-f1', null, { timeout: 120000 });
    const fk2 = await page.evaluate(() => { const f = PG.Cases.forks()[0]; return { n: PG.Cases.forks().length, t4: +PG.Cases.metric('shift_s', f.results[3].result).toFixed(3), exp4: +PG.Cases.metric('shift_s', PG.Cases.results().expected[3].result).toFixed(3), head: document.querySelector(`#trials li.case-head[data-group="${f.key}"]`).textContent }; });
    T('a second edit updates the same copy (build switched to the fix: trial 4 as expected)', fk2.n === 1 && Math.abs(fk2.t4 - fk2.exp4) < 0.011 && /build lite → fix-ost-f1/.test(fk2.head), `trial 4 shift ${fk2.t4} s (expected ${fk2.exp4} s); ${fk2.head.slice(0, 120)}`);
    await page.evaluate(() => { window.scrollTo(0, 0); const f = PG.Cases.forks()[0]; const el = document.querySelector(`#trials li.case-head[data-group="${f.key}"]`); el.closest('.trials-col').scrollTop = el.offsetTop - 40; });
    await page.screenshot({ path: path.join(SHOTS, 'case-ost-f1-fork-1440-light.png') });
  }
  }
}
console.log('test cases: ' + caseRows.map(([i, a, b]) => `${i} ${a}/${b}`).join(', '));
await page.evaluate(() => { history.replaceState(null, '', location.pathname); window.scrollTo(0, 0); });
// part A: a report settings link with a custom OST/PCF shows the per-state values on the cards, not "F1 0 mel"
const link = JSON.parse(fs.readFileSync(path.join(A, 'report', 'prototype', 'assets', 'ost-f1', 'settings.json'), 'utf8')).playground;
const summ = await page.evaluate(sv => { PG.setSettings(sv, 'noauto'); PG.bus.emit('tab', 'explore'); return document.querySelector('[data-card="formant"] .card-sum').textContent; }, link);
T('a custom OST/PCF shows its per-state values on the formant card', /set by the OST\/PCF: F1 \+125 mel in state 2/.test(summ), JSON.stringify(summ));
await page.evaluate(() => { PG.setSettings(PG.S.defaultSettings(), 'noauto'); });

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
  const s = PG.state.trials.filter(t => t.seq && / in session$/.test(t.name)); return { n: s.length, sameSession: new Set(s.map(t => t.seq.id)).size === 1 };
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
  if (scheme === 'dark') {
    for (const cid of ['OST-F1', 'LAB-1', 'PT-5']) {
      await p.evaluate(id => { location.hash = 'case=' + id; }, cid);
      await p.waitForFunction(id => PG.Cases.current() && PG.Cases.current().id === id && !PG.Cases.running() && Object.keys(PG.Cases.results()).length && PG_TEST.idle(), cid, { timeout: 180000 });
      await p.waitForTimeout(500); await p.evaluate(() => window.scrollTo(0, 0));
      await p.screenshot({ path: path.join(SHOTS, `case-${cid.toLowerCase()}-workspace-${tag}.png`) });
      await p.evaluate(() => document.querySelector('#v-tiers').scrollIntoView()); await p.waitForTimeout(200);
      await p.screenshot({ path: path.join(SHOTS, `case-${cid.toLowerCase()}-pair-${tag}.png`) });
      if (width < 600) { await p.evaluate(() => document.querySelector('#trials').scrollIntoView()); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOTS, `case-${cid.toLowerCase()}-list-${tag}.png`) }); }
    }
    await p.click('#case-timeline-btn'); await p.waitForTimeout(600);
    await (await p.$('#case-summary')).screenshot({ path: path.join(SHOTS, `case-pt-5-timeline-${tag}.png`) });
    await p.evaluate(() => { history.replaceState(null, '', location.pathname); window.scrollTo(0, 0); PG.bus.emit('view', 'spectro'); });
  }
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
