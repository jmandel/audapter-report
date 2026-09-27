// 2-D field outside its grid: which cell does Audapter use when F1/F2 lie beyond pertF1/pertF2 but inside f1min..f2max?
import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis;
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
const NS = require(ROOT + '/wasm/lib/audapter-lite.js'); const { PGS, DSP } = globalThis;
const med = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : NaN; };
for (const [F1, F2] of [[800, 1800], [400, 1800], [600, 2600], [600, 1200]]) {
  const x = DSP.synthVowel({ dur: 0.8, onset: 0.1, offset: 0.7, f0: 200, formants: [F1, F2, 2900, 3800], level: -20 });
  const s = PGS.defaultSettings(); s.shift.formant.field = 'variability'; Object.assign(s.shift.formant.vari, { c1: 600, c2: 1800, ext1: 100, ext2: 300, strength: 50 });
  const c = PGS.compile(s); const m = c.map;
  // widen the field bounds so Audapter considers frames outside the grid
  const list = c.list.map(([k, v]) => [k, k === 'f1min' || k === 'f2min' ? 0 : k === 'f1max' || k === 'f2max' ? 5000 : v]);
  const a = await NS.create('lite'); a.setParams(list); a.loadOst(''); a.loadPcf(''); a.reset(); a.processBuffer(x); const d = a.getData();
  const idx = []; for (let i = 0; i < d.fmts[0].length; i++) if (d.sfmts[0][i] > 0) idx.push(i);
  const f1 = med(idx.map(i => d.fmts[0][i])), f2 = med(idx.map(i => d.fmts[1][i])), s1 = med(idx.map(i => d.sfmts[0][i])), s2 = med(idx.map(i => d.sfmts[1][i]));
  const g1 = m.get('pertf1'), g2 = m.get('pertf2');
  console.log(`vowel F1 ${f1.toFixed(0)} F2 ${f2.toFixed(0)} (grid F1 ${g1[0]}-${g1[256]}, F2 ${g2[0]}-${g2[256]}): shift ${(s1 - f1).toFixed(1)}, ${(s2 - f2).toFixed(1)} Hz`);
}
