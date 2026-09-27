// OST simulator (playground/src/js/ostsim.js) vs Audapter's logged ost_stat, per template, on real clips.
import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis; globalThis.PG = {};
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
PG.S = globalThis.PGS; (0, eval)(fs.readFileSync(ROOT + '/playground/src/js/ostsim.js', 'utf8'));
const NS = require(ROOT + '/wasm/lib/audapter-lite.js'); const { PGS, DSP } = globalThis;
for (const clip of ['arctic_slt_a0030', 'arctic_bdl_a0018', 'libri_84-121123-0000', 'so762_0094_123']) {
  const x = DSP.decodeWav(fs.readFileSync(ROOT + `/corpus/audio/${clip}.wav`)).x;
  // dry run
  const s0 = PGS.defaultSettings(); s0.shift.formant.on = false; const c0 = PGS.compile(s0);
  let a = await NS.create('lite'); a.setParams(c0.list); a.loadOst(''); a.loadPcf(''); a.reset(); a.processBuffer(x); const d0 = a.getData();
  const fr = { rms: d0.rms[0], rmsP: d0.rms[1], slope: d0.rms_slope }, fd = 32 / 16000;
  const snd = PG.OstSim.sounds(fr, fd, s0.design.detect);
  console.log('==', clip, 'sounds:', snd.map(z => `${z.on.toFixed(3)}-${z.off.toFixed(3)}`).join(' '));
  for (const [k, T] of Object.entries(PGS.TEMPLATES)) {
    const s = PGS.defaultSettings(); s.when.mode = 'design'; s.design.blocks = T.blocks(s.design.tpl).map(b => ({ ...b, what: { f1: 20, f2: 0, st: 0, db: 0 } }));
    const c = PGS.compile(s);
    a = await NS.create('lite'); a.setParams(c.list); a.loadOst(c.ost); a.loadPcf(c.pcf); a.reset(); a.processBuffer(x); const d = a.getData();
    const pred = PG.OstSim.run(c.ost, fr, fd).states;
    let diff = 0; for (let i = 0; i < pred.length; i++) if (pred[i] !== d.ost_stat[i]) diff++;
    const P = new Set(c.meta.perturbStates);
    let onPred = 0, onLog = 0, shiftOutside = 0; for (let i = 0; i < pred.length; i++) { if (P.has(pred[i])) onPred++; if (P.has(d.ost_stat[i])) onLog++; if (!P.has(pred[i]) && d.sfmts[0][i] > 0 && Math.abs(d.sfmts[0][i] - d.fmts[0][i]) > 0.5) shiftOutside++; }
    console.log(k.padEnd(9), 'state mismatches', diff, '/', pred.length, 'on frames pred', onPred, 'logged', onLog, 'shift outside predicted', shiftOutside, c.notes.map(n => n.text).join(';'));
  }
}
