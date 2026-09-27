// Design compiler check: templates -> OST/PCF, run in WASM (node).
import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis;
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
const { PGS } = globalThis;
for (const [k, T] of Object.entries(PGS.TEMPLATES)) {
  const s = PGS.defaultSettings(); s.when.mode = 'design'; s.design.template = k;
  s.design.blocks = T.blocks(s.design.tpl).map(b => ({ ...b, what: { f1: 20, f2: 0, st: 0, db: 0 } }));
  const c = PGS.compile(s);
  console.log('==', k, PGS.summarize(s)); console.log(c.ost.split('\n').filter(l => /^\d/.test(l)).join(' | '), '|| PCF', c.pcf.split('\n').slice(3).join(' | '), c.notes.map(n => n.text));
}
