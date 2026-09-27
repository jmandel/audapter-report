// PT-5 target: the card's vowel (report_pt5.m dev_vowel_48k.wav). Level of the pvoc output re bPitchShift = 0 at a
// constant 0 st (shipped +3.5 dB, fixed ~0 dB) and, for information, the level step when the PCF switches 0 -> +2 st
// at 0.6 s. Regression inside target(): TIME_WARP_ONLY mode (bPitchShift = 1, PCF with one warp event, no pitch shift)
// shares the patched scaling line and must stay bit-identical (the reference scenarios never run the warp modes).
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { wav, params } from './util.mjs';
const X = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../harness/oct/out/report/pt-5/blab');
export const affects = ['pvoc'];   // the only reference scenario with bPitchShift = 1
const OST = 'rmsSlopeWin = 0.030000\n\nn = 2\n0 ELAPSED_TIME 0.6 NaN {}\n1 OST_END NaN NaN {}\n\nn = 0\n';
const PCF2 = '0\n\n2\n0, 0, 0, 0, 0\n1, 2, 0, 0, 0\n';
const WARP = '1\n0.4, 0.5, 0.2, 0.1, 2.0\n\n2\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n';
const blk = s => { const W = 320, o = []; for (let b = 0; b + W <= s.length; b += W) { let e = 0; for (let i = 0; i < W; i++) e += s[b + i] ** 2; o.push(Math.sqrt(e / W)); } return o; };
const lvl = (d, t0, t1) => { const i = blk(d.signalIn), o = blk(d.signalOut), a = Math.round(t0 / 0.02), b = Math.round(t1 / 0.02); let s = 0;
  for (let k = a; k <= b; k++) s += 20 * Math.log10(o[k] / i[k]); return s / (b - a + 1); };
export async function target(A) {
  const x = wav(path.join(X, 'dev_vowel_48k.wav')), P = params('PT-5');
  const run = async v => {
    const a = await A.create(v);
    a.init('female', { ...P, bpitchshift: 0 }); const d0 = a.runTrial({ input: x });
    a.init('female', P); const d1 = a.runTrial({ input: x });
    a.init('female', P); a.loadOst(OST); a.loadPcf(PCF2); const dS = a.runTrial({ input: x });
    a.init('female', P); a.loadOst(OST); a.loadPcf(WARP); const dW = a.runTrial({ input: x });
    const g0 = lvl(d1, 0.8, 1.15) - lvl(d0, 0.8, 1.15), step = lvl(dS, 0.8, 1.15) - lvl(dS, 0.3, 0.55);
    return { g0, step, warp: dW.output, gW: lvl(dW, 0.8, 1.15) - lvl(d0, 0.8, 1.15) };
  };
  const s = await run('shipped'), f = await run('fix-pt-5');
  let nd = 0; for (let i = 0; i < s.warp.length; i++) if (s.warp[i] !== f.warp[i]) nd++;
  const txt = r => `0 st level ${r.g0 >= 0 ? '+' : ''}${r.g0.toFixed(2)} dB re bPitchShift = 0; step at 0 -> +2 st ${r.step.toFixed(2)} dB`;
  return { shippedBug: Math.abs(s.g0) > 0.5, variantBug: Math.abs(f.g0) > 0.5 || nd > 0,
           shipped: txt(s) + `; time-warp mode ${s.gW.toFixed(2)} dB`,
           variant: txt(f) + `; regression: time-warp mode (PCF warp, no shift) ${nd} of ${s.warp.length} output samples differ from shipped` };
}
