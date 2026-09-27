// I-02 target: report_i02.m scenario (fb 5, babble datapb at RMS 0.1, fb5GainDB_speech +20 dB, three vowels), run at the
// dScale values for closedLoopGain 15 and 21 dB. Shipped: the speech-modulated/playback mix moves with dScale (6 dB here);
// fix-i-02: it does not, and it equals the shipped mix at dScale 1. Regression (the reference scenarios in audit/wasm/testdata
// never use fb 2-5): fb 2, 3 and 4 on the same input, and fb 5 at dScale 1 (x * 1.0 is exact), must be bit-identical
// between the builds (device output and signalOut).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { wav, params } from './util.mjs';
const X = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../harness/oct/out/report/i-02/blab');
export const affects = [];
const W = 960;   // 20 ms blocks at 48 kHz
const blk = s => { const n = Math.floor(s.length / W), o = new Float64Array(n); for (let b = 0; b < n; b++) { let e = 0; for (let i = b * W; i < (b + 1) * W; i++) e += s[i] * s[i]; o[b] = Math.sqrt(e / W); } return o; };
const same = (p, q) => p.length === q.length && p.every((v, i) => v === q[i]);
export async function target(A) {
  const x = wav(path.join(X, 'dev_input_48k.wav')), pb = wav(path.join(X, 'dev_babble_48k.wav'));
  const D = JSON.parse(fs.readFileSync(path.join(X, 'data.json'))), P = params('I-02');
  const act = Array.from(blk(x), v => 20 * Math.log10(v) > -40);
  const run = (a, extra) => { a.init('female', { ...P, ...extra }); a.setParam('datapb', pb); return a.runTrial({ input: x }); };
  const out1 = {};
  const mix = (a, ds, v) => {
    const r = run(a, { dscale: ds }), t = r.output; if (ds === 1) out1[v] = r;
    const s = run(a, { dscale: ds, fb5gain_playback: 0 }).output;
    const rs = blk(s), rp = blk(Float64Array.from(t, (v, i) => v - s[i])); let es = 0, ep = 0;
    act.forEach((on, b) => { if (on) { es += rs[b] ** 2; ep += rp[b] ** 2; } });
    return 10 * Math.log10(es / ep);
  };
  const [dsA, dsB] = [D.dScale[1], D.dScale[2]], res = {}, inst = {};
  for (const v of ['shipped', 'fix-i-02']) { const a = inst[v] = await A.create(v); res[v] = [mix(a, 1, v), mix(a, dsA, v), mix(a, dsB, v)]; }
  // regression: fb 2 / 3 / 4 (fb 4 keeps upstream's double dScale on purpose) must not change
  const reg = [`fb 5 at dScale 1 ${same(out1.shipped.output, out1['fix-i-02'].output) && same(out1.shipped.signalOut, out1['fix-i-02'].signalOut) ? 'bit-identical' : 'DIFFERS'}`];
  for (const fb of [2, 3, 4]) {
    const o = {}; for (const v of ['shipped', 'fix-i-02']) o[v] = run(inst[v], { dscale: dsA, fb, fb2gain: 0.5, fb3gain: 0.5, fb4gaindb: 10 });
    reg.push(`fb ${fb} ${same(o.shipped.output, o['fix-i-02'].output) && same(o.shipped.signalOut, o['fix-i-02'].signalOut) ? 'bit-identical' : 'DIFFERS'}`);
  }
  const regOk = reg.every(s => s.endsWith('bit-identical'));
  const s = res.shipped, f = res['fix-i-02'];
  const harness = Math.max(Math.abs(s[1] - D.mix_db_A), Math.abs(s[2] - D.mix_db_B));   // WASM vs Octave MEX (libm only)
  const txt = r => `mix ${r.map(v => v.toFixed(2)).join(' / ')} dB at dScale 1 / ${dsA.toFixed(3)} / ${dsB.toFixed(3)} (spread ${(Math.max(...r) - Math.min(...r)).toFixed(2)} dB)`;
  return {
    shippedBug: Math.max(...s) - Math.min(...s) > 1 && harness < 0.01,
    variantBug: Math.max(...f) - Math.min(...f) > 0.01 || Math.abs(f[0] - s[0]) > 1e-9 || !regOk,
    shipped: `${txt(s)}; matches harness data.json to ${harness.toExponential(1)} dB`,
    variant: `${txt(f)}; regression vs shipped: ${reg.join(', ')}`,
  };
}
