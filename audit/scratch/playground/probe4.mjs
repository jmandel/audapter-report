import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis;
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
const NS = require(ROOT + '/wasm/lib/audapter-lite.js'); const { PGS, DSP } = globalThis;
const x = DSP.synthVowel({ dur: 2, f0: 200, formants: [750, 1200, 2600, 3500] });
for (const [name, mod] of [['default', s => {}], ['bcepslift=1', s => { s.listen.bcepslift = 1; }], ['pvoc', s => { s.shift.pitch.on = true; }], ['tds', s => { s.shift.pitch.on = true; s.shift.pitch.method = 'tds'; }],
  ['field F1 0% (bshift=1, amp 0 everywhere)', s => { s.shift.formant.f1 = 0.0001; }], ['PCF window, off-state', s => { s.when.mode = 'window'; s.when.after = 1.0; s.when.until = 1.5; }]]) {
  const s = PGS.defaultSettings(); mod(s); const c = PGS.compile(s); const a = await NS.create('lite');
  a.setParams(c.list); a.loadOst(c.ost || ''); a.loadPcf(c.pcf || ''); a.reset(); a.processBuffer(x); const d = a.getData();
  const nz = arr => arr.filter(v => v > 0).length;
  const eq = d.sfmts[0].filter((v, i) => v > 0 && Math.abs(v - d.fmts[0][i]) < 0.01).length;
  console.log(name.padEnd(40), 'pitchHz>0 frames', nz(d.pitchHz), 'sfmts>0', nz(d.sfmts[0]), 'sfmts==fmts', eq, 'fmts>0', nz(d.fmts[0]));
}
