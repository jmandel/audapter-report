import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis;
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
const NS = require(ROOT + '/wasm/lib/audapter-lite.js'); const { PGS, DSP } = globalThis;
// vowel with an F0 glide so the lag is measurable
const x = DSP.synthVowel({ dur: 2, onset: 0.1, offset: 1.9, f0: 150, f0End: 250, formants: [750, 1200, 2600, 3500] });
for (const [name, mod] of [['always', s => {}], ['after 0.5', s => { s.when.mode = 'after'; s.when.after = 0.5; }], ['vowel', s => { s.when.mode = 'vowel'; }]]) {
  const s = PGS.defaultSettings(); s.shift.formant.on = false; s.shift.timing.on = true; mod(s);
  const c = PGS.compile(s); const a = await NS.create('lite');
  a.setParams(c.list); a.loadOst(c.ost || ''); a.loadPcf(c.pcf || ''); a.reset(); a.processBuffer(x); const d = a.getData();
  const fi = DSP.yin(d.signalIn, 16000).f0, fo = DSP.yin(d.signalOut, 16000).f0;
  // lag: for output frame k, find input time with same F0 (monotonic glide)
  const lagAt = t => { const k = Math.round(t / 0.005); const f = fo[k]; if (!(f > 0)) return NaN; let best = 1e9, bi = -1; for (let j = 0; j < fi.length; j++) if (fi[j] > 0 && Math.abs(fi[j] - f) < best) { best = Math.abs(fi[j] - f); bi = j; } return (k - bi) * 5; };
  console.log(name, c.pcf.replace(/\n/g, '|'), 'lag ms at', [0.3, 0.55, 0.65, 0.8, 1.0, 1.3].map(t => `${t}:${lagAt(t)}`).join(' '));
}
