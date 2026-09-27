// Output/input F1 ratio from the same LPC estimator over the same frames (schedule plot), per lag.
import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis;
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
const NS = require(ROOT + '/wasm/lib/audapter-lite.js'); const { PGS, DSP } = globalThis;
const med = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : NaN; };
for (const clip of ['arctic_slt_a0030', 'arctic_bdl_a0018', 'libri_84-121123-0000', 'pvqd_LA9003_a', 'so762_0094_123']) {
  const x = DSP.decodeWav(fs.readFileSync(ROOT + `/corpus/audio/${clip}.wav`)).x;
  for (const f of [0, 0.2]) {
    const s = PGS.defaultSettings(); s.when.mode = 'design'; s.design.detect.onThresh = 0.03; s.design.detect.offThresh = 0.015; s.design.blocks[0].what.f1 = f * 100;
    const c = PGS.compile(s); const a = await NS.create('lite');
    a.setParams(c.list); a.loadOst(c.ost); a.loadPcf(c.pcf); a.reset(); a.processBuffer(x); const d = a.getData();
    const li = DSP.lpcFormants(d.signalIn, 16000), lo = DSP.lpcFormants(d.signalOut, 16000);
    const P = new Set(c.meta.perturbStates), out = [];
    for (const lagMs of [0, 5, 10]) {
      const r = [];
      for (let i = 0; i < d.ost_stat.length; i++) { if (!P.has(d.ost_stat[i]) || !(d.fmts[0][i] > 0)) continue; const t = i / d.frameRate, k = Math.round(t / 0.005), k2 = Math.round((t + lagMs / 1000) / 0.005); const a1 = li.f[0][k], b1 = lo.f[0][k2]; if (a1 > 0 && b1 > 0) r.push(b1 / a1); }
      const sr = [...r].sort((p, q) => p - q), iqr = sr.length ? (sr[Math.floor(sr.length * 0.75)] - sr[Math.floor(sr.length * 0.25)]) : NaN;
      out.push(`lag${lagMs}: n=${r.length} med=${med(r).toFixed(3)} iqr=${iqr.toFixed(3)}`);
    }
    console.log(clip, 'shift', f, out.join(' | '));
  }
}
