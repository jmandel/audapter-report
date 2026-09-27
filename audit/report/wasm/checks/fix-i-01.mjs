// I-01 target: 12 s fb 2 trial (noise only, zero input) with the first 5 s of the bundled babble as datapb, loaded as in
// runExperiment.m (report_i01.m exports every 3rd sample, the only ones the fb 2-5 loop reads; rebuilt at 48 kHz by
// repeating each 3 times). Noise presence from the 48 kHz device output (the lite build's recorder holds only 10 s).
// Regression inside target(): with a full 480000-sample datapb (= maxPBSize, the loop point of both builds) a 12 s fb 2
// and fb 3 trial must be bit-identical on both builds (the reference scenarios never use fb 2-5).
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { wav } from './util.mjs';
const X = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../harness/oct/out/report/i-01/blab');
export const affects = [];
const P = { rmsthresh: 0.005, bdetect: 1, btrack: 1, fb2gain: 0.05, fb3gain: 0.05, dscale: 1 };
export async function target(A) {
  const nb = wav(path.join(X, 'dev_babble_every3rd_16k.wav')), vv = wav(path.join(X, 'dev_vowels3_48k.wav'));
  let m = 0; for (const v of nb) m += v; m /= nb.length; let r = 0; for (const v of nb) r += (v - m) ** 2; r = Math.sqrt(r / nb.length);
  const noise = n48 => { const o = new Float64Array(n48); for (let i = 0; i < n48; i++) o[i] = (nb[Math.floor(i / 3) % nb.length] - m) / r; return o; };
  const x = new Float64Array(12 * 48000);
  for (let k = 0; k <= 10; k++) { const s = (k % 3) * 24000, i0 = Math.round((0.3 + k) * 48000); for (let i = 0; i < 24000; i++) x[i0 + i] += vv[s + i]; }
  const gaps = y => { const W = 960, g = []; let a = null;
    for (let b = 0; b + W <= y.length; b += W) { let e = 0; for (let i = 0; i < W; i++) e += y[b + i] ** 2; const on = Math.sqrt(e / W) > 1e-4;
      if (!on && a === null) a = b / 48000; if (on && a !== null) { g.push([a, b / 48000]); a = null; } }
    if (a !== null) g.push([a, y.length / 48000]); return g; };
  const run = async v => { const a = await A.create(v), o = {};
    const trial = (fb, pb, inp) => { a.init('female', { ...P, fb }); a.setParam('datapb', pb); return a.runTrial({ input: inp }).output; };
    o.g5 = gaps(trial(2, noise(5 * 48000), new Float64Array(x.length)));
    o.r2 = trial(2, noise(480000), new Float64Array(x.length)); o.r3 = trial(3, noise(480000), x);
    return o; };
  const s = await run('shipped'), f = await run('fix-i-01');
  let nd = 0; for (const k of ['r2', 'r3']) for (let i = 0; i < s[k].length; i++) if (s[k][i] !== f[k][i]) nd++;
  const txt = g => g.length ? 'noise absent ' + g.map(([a, b]) => `${a.toFixed(2)}-${b.toFixed(2)} s`).join(', ') : 'noise throughout';
  return { shippedBug: s.g5.length > 0, variantBug: f.g5.length > 0 || nd > 0,
           shipped: `5 s datapb, 12 s fb 2 trial: ${txt(s.g5)}`,
           variant: `5 s datapb: ${txt(f.g5)}; regression: 480000-sample datapb, 12 s fb 2 + fb 3 trials: ${nd} of ${s.r2.length + s.r3.length} output samples differ from shipped` };
}
