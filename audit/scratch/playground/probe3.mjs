import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis;
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
const NS = require(ROOT + '/wasm/lib/audapter-lite.js');
const { PGS, DSP } = globalThis;
const x = DSP.synthVowel({ dur: 2, onset: 0.2, offset: 1.8, f0: 200, formants: [750, 1200, 2600, 3500], formantsEnd: [300, 2300, 3000, 3700], level: -20 });
for (const mod of [s => { s.when.mode = 'window'; s.when.after = 0.5; s.when.until = 1.0; }, s => { s.shift.formant.field = 'region'; s.shift.formant.region = { f1min: 500, f1max: 1000, f2min: 0, f2max: 5000 }; }]) {
  const s = PGS.defaultSettings(); mod(s);
  const c = PGS.compile(s); const a = await NS.create('lite'); a.setParams(c.list); a.loadOst(c.ost || ''); a.loadPcf(c.pcf || ''); a.reset();
  a.processBuffer(x); const d = a.getData();
  console.log(s.when.mode, s.shift.formant.field);
  for (let t = 0.3; t < 1.9; t += 0.1) { const i = Math.round(t * d.frameRate); console.log(t.toFixed(1), 'stat', d.ost_stat[i], 'F1', d.fmts[0][i].toFixed(0), 'sF1', d.sfmts[0][i].toFixed(0), 'F2', d.fmts[1][i].toFixed(0), 'sF2', d.sfmts[1][i].toFixed(0)); }
}
