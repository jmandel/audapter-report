// Probe: compile() semantics on the real WASM core (node).
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
globalThis.self = globalThis;
const defs = fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return ');
globalThis.AUD_DEFAULTS = new Function(defs)();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
require(ROOT + '/wasm/lib/audapter-lite.js'); const NS = require(ROOT + '/wasm/lib/audapter-patched.js');
const { PGS, DSP } = globalThis;
const x = DSP.synthVowel({ dur: 2, onset: 0.2, offset: 1.8, f0: 200, formants: [750, 1200, 2600, 3500], level: -20 });
async function run(mod, variant = 'lite') {
  const s = PGS.defaultSettings(); mod(s);
  const c = PGS.compile(s); const a = await NS.create(variant);
  a.setParams(c.list); a.loadOst(c.ost || ''); a.loadPcf(c.pcf || ''); a.reset();
  const out = a.processBuffer(x); const d = a.getData();
  return { c, d, out, a };
}
const med = arr => { const v = arr.filter(Number.isFinite).sort((a, b) => a - b); return v.length ? v[v.length >> 1] : NaN; };
const ratio = (d, k) => med(Array.from(d.fmts[k]).map((f, i) => f > 0 && d.sfmts[k][i] > 0 && Math.abs(d.sfmts[k][i] - f) > 1e-6 ? d.sfmts[k][i] / f : NaN));
const lvl = (y, t0, t1) => 20 * Math.log10(Math.sqrt(y.slice(t0 * 48000, t1 * 48000).reduce((s, v) => s + v * v, 0) / ((t1 - t0) * 48000)));
let r = await run(s => {}); console.log('F1+20 always: ratio F1', ratio(r.d, 0), 'F2', ratio(r.d, 1));
r = await run(s => { s.shift.formant.units = 'hz'; s.shift.formant.f1 = 0; s.shift.formant.f2 = -200; }); console.log('F2 -200 Hz: median sF2-F2', med(Array.from(r.d.fmts[1]).map((f, i) => f > 0 ? r.d.sfmts[1][i] - f : NaN)));
r = await run(s => { s.when.mode = 'after'; s.when.after = 1.0; }); 
{ const on = Array.from(r.d.sfmts[0]).map((v, i) => r.d.fmts[0][i] > 0 && Math.abs(v - r.d.fmts[0][i]) > 1 ? i / r.d.frameRate : NaN).filter(Number.isFinite); console.log('after 1.0: first shifted frame t=', on[0], 'ratio', ratio(r.d, 0), 'ost max', Math.max(...r.d.ost_stat)); }
r = await run(s => { s.shift.formant.on = false; s.shift.loudness.on = true; s.shift.loudness.db = 6; s.when.mode = 'after'; s.when.after = 1.0; });
console.log('loudness +6 after 1s: level 0.5-0.9', lvl(r.out, 0.5, 0.9).toFixed(2), '1.2-1.7', lvl(r.out, 1.2, 1.7).toFixed(2));
r = await run(s => { s.shift.formant.on = false; s.shift.pitch.on = true; s.shift.pitch.semitones = 2; });
{ const y = DSP.yin(r.d.signalOut, 16000), yi = DSP.yin(r.d.signalIn, 16000); console.log('pvoc +2: f0 in', med(Array.from(yi.f0).filter(v => v > 0)), 'out', med(Array.from(y.f0).filter(v => v > 0))); }
r = await run(s => { s.shift.formant.on = false; s.shift.pitch.on = true; s.shift.pitch.method = 'tds'; s.shift.pitch.semitones = 2; });
{ const y = DSP.yin(r.d.signalOut, 16000); console.log('tds +2: out f0', med(Array.from(y.f0).filter(v => v > 0)), 'pitchHz', med(Array.from(r.d.pitchHz).filter(v => v > 0)), 'shifted', med(Array.from(r.d.shiftedPitchHz).filter(v => v > 0))); }
r = await run(s => { s.shift.formant.on = false; s.shift.pitch.on = true; s.shift.pitch.semitones = 2; s.when.mode = 'after'; s.when.after = 1.0; });
{ const y = DSP.yin(r.d.signalOut, 16000); const f = Array.from(y.f0); console.log('pvoc +2 after 1s: f0 0.5-0.9', med(f.slice(100, 180).filter(v => v > 0)), '1.2-1.7', med(f.slice(240, 340).filter(v => v > 0))); }
r = await run(s => { s.shift.formant.on = false; s.shift.timing.on = true; s.when.mode = 'after'; s.when.after = 0.5; });
console.log('timing warp: pcf', JSON.stringify(r.c.pcf), 'out len', r.out.length, 'lvl', lvl(r.out, 0.3, 1.6).toFixed(1));
r = await run(s => { s.shift.formant.on = false; s.shift.delay.on = true; s.shift.delay.ms = 100; });
{ const a = r.d.signalIn, b = r.d.signalOut; let best = 0, bl = 0; for (let L = 0; L < 3200; L += 8) { let c = 0; for (let i = 0; i < a.length - L; i += 4) c += a[i] * b[i + L]; if (c > best) { best = c; bl = L; } } console.log('delay 100ms: lag', bl / 16, 'ms'); }
r = await run(s => { s.shift.formant.on = false; s.hear.fb = 3; s.hear.noise.seconds = 1; });
console.log('fb3 noise 1s: out level 1.9-2.0 (after vowel)', lvl(r.out, 1.9, 2.0).toFixed(1), 'datapb len', r.c.map.get('datapb').length);
r = await run(s => { s.shift.formant.field = 'painted'; s.shift.formant.painted.cells = []; for (let ci = 0; ci < 65; ci++) for (let cj = 0; cj < 65; cj++) if (ci * 4 * 19.53 > 600 && ci * 4 * 19.53 < 900 && cj * 4 * 19.53 > 1000 && cj * 4 * 19.53 < 1500) s.shift.formant.painted.cells.push([ci, cj, 0, 20]); });
console.log('painted F1 600-900 x F2 1000-1500, F2 +20: ratio F1', ratio(r.d, 0), 'F2', ratio(r.d, 1), 'median F1/F2', med(Array.from(r.d.fmts[0]).filter(v=>v>0)), med(Array.from(r.d.fmts[1]).filter(v=>v>0)));
r = await run(s => { s.shift.formant.field = 'painted'; s.shift.formant.painted.cells = []; for (let ci = 0; ci < 65; ci++) for (let cj = 0; cj < 65; cj++) if (cj * 4 * 19.53 > 600 && cj * 4 * 19.53 < 900 && ci * 4 * 19.53 > 1000 && ci * 4 * 19.53 < 1500) s.shift.formant.painted.cells.push([ci, cj, 0, 20]); });
console.log('transposed painting (should NOT shift): ratio F2', ratio(r.d, 1));
r = await run(s => { s.when.mode = 'vowel'; }); console.log('vowel mode ost', JSON.stringify(r.c.ost), 'ost states seen', [...new Set(r.d.ost_stat)], 'ratio', ratio(r.d, 0));
console.log('warnings sample', PGS.warnings(PGS.defaultSettings(), PGS.compile(PGS.defaultSettings()), {}).length);
