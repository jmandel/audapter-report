// OST-F1 target: report_ost_f1.m scenario (vowels; trial B, trial A, trial B on one instance).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { wav, params, first } from './util.mjs';
const X = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../harness/oct/out/report/ost-f1/blab');
export const affects = [];
const OST = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n';
const PCF = '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0.3, 0\n2, 0, 0, 0, 0\n';
export async function target(A) {
  const xA = wav(path.join(X, 'dev_trialA_48k.wav')), xB = wav(path.join(X, 'dev_trialB_48k.wav'));
  const P = params('OST-F1');
  const run = async v => { const a = await A.create(v); a.init('female', P); a.loadOst(OST); a.loadPcf(PCF);
    const b0 = a.runTrial({ input: xB }); a.runTrial({ input: xA }); const b1 = a.runTrial({ input: xB }); return [first(b0, 2), first(b1, 2)]; };
  const s = await run('shipped'), f = await run('fix-ost-f1');
  const bug = r => Math.abs(r[1] - r[0]) > 0.05;
  return { shippedBug: bug(s), variantBug: bug(f), shipped: `trial B state 2 at ${s[0].toFixed(3)} s first, ${s[1].toFixed(3)} s after A`,
           variant: `trial B state 2 at ${f[0].toFixed(3)} s first, ${f[1].toFixed(3)} s after A` };
}
