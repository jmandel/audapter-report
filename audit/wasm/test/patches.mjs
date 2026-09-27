// Buggy vs patched: the lib/ bundles (classic scripts, loaded here via require exactly as a page would load them
// with <script>) run the harness scenarios for OST-F1, OST-F2 and I-01 on the unpatched ('lite') and 'patched' builds.
// Expected: lite reproduces each bug, patched fixes it. Also asserts patched == lite bit-exactly on the
// equivalence scenarios (the fixes must not change single-trial DSP).
// Usage: node wasm/test/patches.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
require(path.join(W, 'lib', 'audapter-lite.js'));
const Audapter = require(path.join(W, 'lib', 'audapter-patched.js'));
let fails = 0;
const T = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${detail}`); if (!ok) fails++; };

// deterministic Gaussian noise (mulberry32 + Box-Muller)
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function burst(t0, t1, dur, amp, seed) {
  const fs = 48000, n = Math.round(dur * fs), r = rng(seed), x = new Float64Array(n);
  for (let i = 0; i < n; i += 2) {
    const u = Math.max(r(), 1e-12), v = r(), m = Math.sqrt(-2 * Math.log(u));
    for (let k = 0; k < 2 && i + k < n; k++) { const g = m * (k ? Math.sin(2 * Math.PI * v) : Math.cos(2 * Math.PI * v)); const t = (i + k) / fs; x[i + k] = (t >= t0 && t < t1 ? amp * g : 0) + 1e-4 * g; }
  }
  return x;
}
const P = { rmsThresh: 0.005, bDetect: 1, bTrack: 1 };   // harness defparams('female')
const first = (d, s) => { const i = d.ost_stat.findIndex(v => v >= s); return i < 0 ? NaN : i / d.frameRate; };
const FALL = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n';
const IOI = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 ELAPSED_TIME 0.1 NaN {}\n3 OST_END NaN NaN {}\n\nn = 1\n0 0.2 2\n';

const res = {};
for (const v of ['lite', 'patched']) {
  const a = await Audapter.create(v);
  const bug = v === 'lite';
  const r = res[v] = { info: a.info };
  // OST-F1: trial A (burst to 1.6 s) then trial B (burst to 0.4 s); INTENSITY_FALL must fire ~0.4 s in trial B
  a.init('female', P); const dA = a.runTrial({ input: burst(0.04, 1.6, 2.0, 0.05, 1), ost: FALL });
  a.init('female', P); const dB = a.runTrial({ input: burst(0.04, 0.4, 2.0, 0.05, 2), ost: FALL });
  r.f1 = [first(dA, 2), first(dB, 2)];
  T(`[${v}] OST-F1 trial B offset detected at 0.40 s`, (Math.abs(r.f1[1] - 0.4) < 0.08) !== bug,
    `trial A state 2 at ${r.f1[0].toFixed(3)} s (burst end 1.60), trial B at ${r.f1[1].toFixed(3)} s (burst end 0.40)${bug ? ' -> bug reproduced' : ''}`);
  // OST-F2: maxIOI timeout; OST loaded once, trials separated only by reset
  a.init('female', P); a.loadOst(IOI);
  const t2 = [], held = [];
  for (let k = 0; k < 3; k++) { const d = a.runTrial({ input: burst(0, 0, 1.0, 0, 10 + k) }); t2.push(first(d, 2)); held.push(first(d, 3) - first(d, 2)); }
  r.f2 = { t2, held };
  const ok2 = t2.every(t => Math.abs(t - 0.2) < 0.01) && held.every(h => Math.abs(h - 0.1) < 0.01);
  T(`[${v}] OST-F2 maxIOI: state 2 at 0.2 s and held 0.1 s in 3 trials`, ok2 !== bug,
    `state 2 at ${t2.map(t => t.toFixed(3)).join('/')} s, held ${held.map(t => t.toFixed(3)).join('/')} s${bug ? ' -> bug reproduced' : ''}`);
  // I-01: fb=2 (noise only), 5 s of constant datapb must loop without a 5 s silent gap
  a.init('female', { ...P, fb: 2, datapb: new Float64Array(240000).fill(0.1) });
  const out = a.runTrial({ input: new Float64Array(12 * 48000) }).output;
  const mabs = (t0, t1) => { let s = 0; const i0 = Math.round(t0 * 48000), i1 = Math.round(t1 * 48000); for (let i = i0; i < i1; i++) s += Math.abs(out[i]); return s / (i1 - i0); };
  r.i01 = [mabs(0.5, 4.9), mabs(5.1, 9.9), mabs(10.1, 11.9)];
  T(`[${v}] I-01 datapb loops at its length (no gap 5-10 s)`, (r.i01[1] > 0.05) !== bug,
    `mean |out| 0.5-4.9 s ${r.i01[0].toFixed(3)}, 5.1-9.9 s ${r.i01[1].toFixed(3)}, 10.1-11.9 s ${r.i01[2].toFixed(3)}${bug ? ' -> bug reproduced' : ''}`);
}

// Fixes must not change single-trial processing: patched == lite on the reference scenarios.
const lite = await Audapter.create('lite'), pat = await Audapter.create('patched');
for (const s of ['passthru', 'fmtshift', 'pcf', 'pvoc', 'tdshift']) {
  const m = JSON.parse(fs.readFileSync(path.join(W, 'testdata', s, 'meta.json')));
  const b = fs.readFileSync(path.join(W, 'testdata', s, 'in.f64')), x = new Float64Array(b.buffer, b.byteOffset, b.byteLength / 8);
  const run = a => {
    a.loadOst(''); a.loadPcf('');
    for (const c of m.cmds) { if (c.op === 'setParam') a.setParam(c.name, c.value); else if (c.op === 'ost') a.loadOst(c.text); else if (c.op === 'pcf') a.loadPcf(c.text); else if (c.op === 'reset') a.reset(); }
    return a.processBuffer(x);
  };
  const y1 = run(lite), y2 = run(pat);
  let nd = 0; for (let i = 0; i < y1.length; i++) if (y1[i] !== y2[i]) nd++;
  T(`patched == lite on '${s}'`, nd === 0, `${nd} samples differ`);
}
fs.writeFileSync(path.join(W, 'test', 'patches-result.json'), JSON.stringify(res, null, 1));
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exitCode = fails ? 1 : 0;
