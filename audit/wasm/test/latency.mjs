// Algorithmic input->output latency of the Audapter core (device rate), from the reference runs:
// lag of the cross-correlation peak between runFrame input and output, plus an impulse test through the WASM build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AudapterWasm } from '../web/audapter-api.mjs';
const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const f64 = f => { const b = fs.readFileSync(f); return new Float64Array(b.buffer, b.byteOffset, b.byteLength / 8); };
for (const s of ['passthru', 'fmtshift', 'pvoc', 'tdshift']) {
  const m = JSON.parse(fs.readFileSync(path.join(W, 'testdata', s, 'meta.json')));
  const x = f64(path.join(W, 'testdata', s, 'in.f64')), y = f64(path.join(W, 'testdata', s, 'out.f64'));
  let best = [0, -1];
  for (let lag = 0; lag < 4000; lag++) { let d = 0; for (let i = 0; i + lag < x.length; i += 1) d += x[i] * y[i + lag]; if (d > best[1]) best = [lag, d]; }
  console.log(`${s.padEnd(9)} frame ${m.frameSize} @ ${m.fs} Hz: xcorr peak lag ${best[0]} samples = ${(best[0] / m.fs * 1000).toFixed(2)} ms`);
}
// impulse through default params (bTrack on, no shift) with detection gate low
const factory = (await import(path.join(W, 'dist', 'audapter-full.mjs'))).default;
const a = await AudapterWasm.create(factory);
const init = JSON.parse(fs.readFileSync(path.join(W, 'web', 'init-cmds.json')));
for (const c of init) a.setParam(c.name, c.value);
a.reset();
const N = a.frameSize(), x = new Float64Array(N * 200); x[N * 100] = 0.5;
const y = new Float64Array(x.length);
for (let k = 0; k < 200; k++) y.set(a.process(x.subarray(k * N, (k + 1) * N)), k * N);
let pk = 0; for (let i = 1; i < y.length; i++) if (Math.abs(y[i]) > Math.abs(y[pk])) pk = i;
let e = 0, cum = 0, tot = y.reduce((p, v) => p + v * v, 0), c50 = -1;
for (let i = 0; i < y.length; i++) { cum += y[i] * y[i]; if (c50 < 0 && cum > tot / 2) c50 = i; }
console.log(`impulse (defaults, 48 kHz): peak at +${pk - N * 100} samples = ${((pk - N * 100) / 48).toFixed(2)} ms; energy centroid(50%) +${((c50 - N * 100) / 48).toFixed(2)} ms`);
// pvoc at ratio 1 (bPitchShift on): latency of the phase-vocoder path, using a 120 Hz pulse train + xcorr
for (const [label, extra] of [['pvoc ratio 1.0', [['bpitchshift', 1], ['pitchshiftratio', 1]]], ['bypassfmt', [['bbypassfmt', 1]]]]) {
  const b = await AudapterWasm.create(factory);
  for (const c of init) b.setParam(c.name, c.value);
  for (const [n, v] of extra) b.setParam(n, v);
  b.reset();
  const xs = new Float64Array(N * 500); for (let i = N * 50; i < xs.length - N * 50; i += 1500) xs[i] = 0.3;
  const ys = new Float64Array(xs.length);
  for (let k = 0; k < 500; k++) ys.set(b.process(xs.subarray(k * N, (k + 1) * N)), k * N);
  let best = [0, -1e9];
  for (let lag = 0; lag < 1500; lag++) { let d = 0; for (let i = 0; i + lag < xs.length; i++) d += xs[i] * ys[i + lag]; if (d > best[1]) best = [lag, d]; }
  console.log(`${label}: pulse-train xcorr peak lag ${best[0]} samples = ${(best[0] / 48).toFixed(2)} ms (pulse period 1500 samples)`);
}
