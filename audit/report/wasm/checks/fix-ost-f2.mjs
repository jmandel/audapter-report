// OST-F2 target: report_ost_f2.m scenario (soft vowel below the onset threshold, maxIOI 0.2 s -> state 2,
// ELAPSED_TIME 0.1 s -> state 3, F1 +30 % in state 3). Three trials on one instance, OST/PCF loaded once.
// Bug = ELAPSED_TIME held < 0.05 s in any trial, or the timeout drifting (> 0.05 s from trial 1).
// Also runs fix-ost-f1 (if built) to report which fix addresses which symptom, and a nearby regression case
// the patch must not change: the same trials with the OST reloaded before every trial and no maxIOI section.
import path from 'node:path'; import { fileURLToPath } from 'node:url'; import fs from 'node:fs';
import { createRequire } from 'node:module';
import { wav, params, first } from './util.mjs';
const X = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../harness/oct/out/report/ost-f2/blab');
const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../prototype/wasm');
export const affects = [];
const OST = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 ELAPSED_TIME 0.1 NaN {}\n3 OST_END NaN NaN {}\n\nn = 1\n0 0.2 2\n';
const PCF = '0\n\n4\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0, 0\n3, 0, 0, 0.3, 0\n';
const CTRL = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.2 NaN {}\n1 ELAPSED_TIME 0.1 NaN {}\n2 OST_END NaN NaN {}\n\nn = 0\n';
const CPCF = '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0.3, 0\n';
const f3 = x => x.toFixed(3);
export async function target(A) {
  const x = wav(path.join(X, 'dev_vowel_48k.wav')), P = params('OST-F2');
  const run = async v => {
    const a = await A.create(v); a.init('female', P); a.loadOst(OST); a.loadPcf(PCF);
    const r = [0, 1, 2].map(() => a.runTrial({ input: x }));
    return { s2: r.map(d => first(d, 2)), held: r.map(d => first(d, 3) - first(d, 2)) };
  };
  const ctrl = async v => {   // regression: no maxIOI, OST reloaded each trial; must be bit-identical between builds
    const a = await A.create(v); a.init('female', P); const outs = [];
    for (let k = 0; k < 2; k++) { outs.push(a.runTrial({ input: x, ost: CTRL, pcf: CPCF })); }
    return outs;
  };
  const bug = r => r.held.some(h => Math.abs(h - 0.1) > 0.05) || r.s2.some(s => Math.abs(s - r.s2[0]) > 0.05);
  const txt = r => `state 2 at ${r.s2.map(f3).join('/')} s, held ${r.held.map(f3).join('/')} s`;
  const s = await run('shipped'), f = await run('fix-ost-f2');
  const c0 = await ctrl('shipped'), c1 = await ctrl('fix-ost-f2');
  let same = 0, tot = 0;
  c0.forEach((d, i) => { const o0 = d.output, o1 = c1[i].output; tot += o0.length; for (let j = 0; j < o0.length; j++) if (o0[j] === o1[j]) same++; });
  const regOK = same === tot && c0.every((d, i) => d.ost_stat.every((v, j) => v === c1[i].ost_stat[j]));
  let f1 = '';
  const b1 = path.join(W, 'audapter-fix-ost-f1.js');   // informational: which symptom the OST-F1 fix alone clears
  if (fs.existsSync(b1)) { createRequire(import.meta.url)(b1); f1 = `; fix-ost-f1 alone: ${txt(await run('fix-ost-f1'))}`; }
  return { shippedBug: bug(s), variantBug: bug(f) || !regOK,
           shipped: txt(s) + f1,
           variant: `${txt(f)}; regression (no maxIOI, reloaded OST, 2 trials): ${regOK ? 'bit-identical to shipped' : `DIFFERS (${tot - same} samples)`}` };
}
