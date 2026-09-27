// OST-F1 target: the card's mixed design (report_ost_f1.m), trials 1-5 on one instance: RMS-floor onset -> INTENSITY_FALL,
// F1 +125 mel in state 2, trial 3 a long catch trial. The bug: trial 4's offset is detected far later than trial 1's
// (same first-word length); with the fix both are equal.
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { wav, params, first } from './util.mjs';
const X = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../harness/oct/out/report/ost-f1/blab');
export const affects = [];
const OST = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR 0.2 0.02 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n';
const ON = '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 125, 0\n3, 0.0, 0, 0, 0\n';
const OFF = '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n';
export async function target(A) {
  const xs = [1, 2, 3, 4, 5].map(k => wav(path.join(X, `dev_t${k}_48k.wav`)));
  const P = params('OST-F1');
  const run = async v => { const a = await A.create(v); a.init('female', P); a.loadOst(OST); const t = [];
    xs.forEach((x, k) => { a.loadPcf(k === 2 ? OFF : ON); t.push(first(a.runTrial({ input: x }), 3)); }); return t; };
  const s = await run('shipped'), f = await run('fix-ost-f1');
  const bug = r => !(Math.abs(r[3] - r[0]) < 0.005);
  const txt = r => `offset detected in trials 1-5 at ${r.map(x => isNaN(x) ? 'never' : x.toFixed(3) + ' s').join(', ')}`;
  return { shippedBug: bug(s), variantBug: bug(f), shipped: txt(s), variant: txt(f) };
}
