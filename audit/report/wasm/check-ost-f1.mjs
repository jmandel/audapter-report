// Node check: the WASM variants reproduce the harness numbers for OST-F1 (buggy) and show the fix (patched).
import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const OSTF1 = require('../templates/widgets/ost-f1-core.js');
const R = new URL('..', import.meta.url).pathname;
const init = JSON.parse(fs.readFileSync(R + 'wasm/init-ost-f1.json'));
const wav = f => OSTF1.parseWav(fs.readFileSync(R + '../harness/oct/out/report/ost-f1/blab/' + f)).x;
const xA = wav('dev_trialA_48k.wav'), xB = wav('dev_trialB_48k.wav');
const ref = JSON.parse(fs.readFileSync(R + '../harness/oct/out/report/ost-f1/blab/data.json'));
for (const v of ['buggy', 'patched']) {
  const { default: factory } = await import(R + `prototype/wasm/audapter-${v}.mjs`);
  const M = await factory({ print() {}, printErr() {} });
  const a = OSTF1.wrap(M);
  const r = OSTF1.run(a, init, xA, xB);
  console.log(`${v}: state2 B fresh ${r.B0.state2?.toFixed(3)}  A ${r.A.state2?.toFixed(3)}  B after A ${r.B1.state2?.toFixed(3)}` +
    (v === 'buggy' ? `   (harness: ${ref.state2_B_fresh_s} / ${ref.state2_A_s} / ${ref.state2_B_after_A_s})` : ''));
}
