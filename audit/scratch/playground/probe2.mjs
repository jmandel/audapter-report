import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis;
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
const NS = require(ROOT + '/wasm/lib/audapter-lite.js');
const { PGS, DSP } = globalThis;
const x = DSP.synthVowel({ dur: 2, onset: 0.2, offset: 1.8, f0: 200, formants: [750, 1200, 2600, 3500], level: -20 });
const s = PGS.defaultSettings(); s.when.mode = 'after'; s.when.after = 1.0;
const c = PGS.compile(s); console.log(c.ost, c.pcf);
const a = await NS.create('lite'); a.setParams(c.list); a.loadOst(c.ost); a.loadPcf(c.pcf); a.reset();
a.processBuffer(x); const d = a.getData();
const st = Array.from(d.ost_stat); console.log('first stat1 frame t', st.indexOf(1) / d.frameRate);
for (const t of [0.1, 0.3, 0.6, 0.9, 1.1, 1.5]) { const i = Math.round(t * d.frameRate); console.log(t, 'stat', st[i], 'F1', d.fmts[0][i].toFixed(0), 'sF1', d.sfmts[0][i].toFixed(0)); }
// noise 10 s with fb3
const s2 = PGS.defaultSettings(); s2.shift.formant.on = false; s2.hear.fb = 3; s2.hear.noise.seconds = 10;
const c2 = PGS.compile(s2); const b = await NS.create('lite'); b.setParams(c2.list); b.reset(); const y = b.processBuffer(x);
const lvl = (y, t0, t1) => 20 * Math.log10(Math.sqrt(y.slice(t0 * 48000, t1 * 48000).reduce((s, v) => s + v * v, 0) / ((t1 - t0) * 48000)));
console.log('fb3 10 s noise: level 0-0.15', lvl(y, 0, 0.15).toFixed(1), '1.9-2', lvl(y, 1.9, 2).toFixed(1));
