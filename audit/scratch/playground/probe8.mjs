// Sound segmentation by Audapter's level rules at thresholds relative to each clip's peak RMS.
import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis; globalThis.PG = {};
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
PG.S = globalThis.PGS; (0, eval)(fs.readFileSync(ROOT + '/playground/src/js/ostsim.js', 'utf8'));
const NS = require(ROOT + '/wasm/lib/audapter-lite.js'); const { PGS, DSP } = globalThis;
for (const clip of ['arctic_slt_a0030', 'arctic_bdl_a0018', 'libri_84-121123-0000', 'so762_0094_123', 'arctic_clb_a0036']) {
  const x = DSP.decodeWav(fs.readFileSync(ROOT + `/corpus/audio/${clip}.wav`)).x;
  const s0 = PGS.defaultSettings(); s0.shift.formant.on = false; const c0 = PGS.compile(s0);
  const a = await NS.create('lite'); a.setParams(c0.list); a.reset(); a.processBuffer(x); const d0 = a.getData();
  const fr = { rms: d0.rms[0], rmsP: d0.rms[1], slope: d0.rms_slope }; const pk = Math.max(...fr.rms);
  for (const [on, off] of [[-12, -18], [-10, -14], [-8, -12]]) {
    const det = { onThresh: pk * 10 ** (on / 20), onHold: 0.02, offThresh: pk * 10 ** (off / 20), offMin: 0.02 };
    const snd = PG.OstSim.sounds(fr, 0.002, det);
    console.log(clip, 'peak', pk.toFixed(3), on, off, snd.map(z => `${z.on.toFixed(2)}-${z.off.toFixed(2)}`).join(' '));
  }
}
