// Cards under a custom OST/PCF: what pcfShifts reports for the OST-F1 report link's settings, and the compiled switches.
import fs from 'node:fs';
const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis;
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
const { PGS } = globalThis;
const S = JSON.parse(fs.readFileSync(ROOT + '/report/prototype/assets/ost-f1/settings.json', 'utf8')).playground;
const s = PGS.normalize(S), c = PGS.compile(s);
console.log(JSON.stringify(S.shift), S.when.mode);
console.log(PGS.pcfShifts(s), 'bshift', c.map.get('bshift'), 'mel', c.map.get('bmelshift'));
s.shift.formant.on = false; console.log('card off ->', PGS.compile(s).map.get('bshift'));
