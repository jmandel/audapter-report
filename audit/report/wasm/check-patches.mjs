// Verify every patched WASM variant (report/wasm/variants.yaml) against the shipped build:
//  1. regression: bit-identical output (device-rate audio, signalIn/Out, data matrix except the LPC columns, WASM-1) on every reference scenario in
//     audit/wasm/testdata that the patch is not meant to change (checks/<variant>.mjs may list `affects`);
//  2. target: checks/<variant>.mjs `target(A)` runs the finding's scenario on both builds; shipped must show the bug
//     and the variant must not.
// Usage: node audit/report/wasm/check-patches.mjs [variant ...]      Writes report/wasm/check-patches.json
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TD = path.resolve(R, '..', 'wasm', 'testdata');
const require = createRequire(import.meta.url);
const yaml = fs.readFileSync(path.join(R, 'wasm', 'variants.yaml'), 'utf8');
const all = [...yaml.matchAll(/^  ([a-z0-9-]+):\s*\{/gm)].map(m => m[1]);
const want = process.argv.slice(2).length ? process.argv.slice(2) : all.filter(v => v !== 'shipped');
let A; for (const v of ['shipped', ...want]) A = require(path.join(R, 'prototype', 'wasm', `audapter-${v}.js`));
let fails = 0; const out = {};
const T = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${detail}`); if (!ok) fails++; return ok; };
const scen = fs.readdirSync(TD).filter(s => fs.existsSync(path.join(TD, s, 'meta.json')));
function replay(a, s) {
  const m = JSON.parse(fs.readFileSync(path.join(TD, s, 'meta.json')));
  const b = fs.readFileSync(path.join(TD, s, 'in.f64')), x = new Float64Array(b.buffer, b.byteOffset, b.byteLength / 8);
  a.loadOst(''); a.loadPcf('');
  for (const c of m.cmds) { if (c.op === 'setParam') a.setParam(c.name, c.value); else if (c.op === 'ost') a.loadOst(c.text); else if (c.op === 'pcf') a.loadPcf(c.text); else if (c.op === 'reset') a.reset(); }
  const y = a.processBuffer(x), s2 = a.getSignal(), d = a.getRawData();
  // Drop the LPC-coefficient columns (0-based 4+2nT+4 .. +nLPC): before the first voiced frame they hold
  // uninitialised heap memory that differs between any two instances (finding WASM-1), patched or not.
  const nT = a.getParam('ntracks')[0], nLPC = a.getParam('nlpc')[0], c0 = 4 + 2 * nT + 4, c1 = c0 + nLPC;
  const keep = []; for (let j = 0; j < d.cols; j++) if (j < c0 || j > c1) keep.push(d.data.subarray(j * d.rows, (j + 1) * d.rows));
  const dd = new Float64Array(keep.length * d.rows); keep.forEach((c, j) => dd.set(c, j * d.rows));
  return [y, s2.signalIn, s2.signalOut, dd];
}
const ndiff = (p, q) => { if (p.length !== q.length) return Infinity; let n = 0; for (let i = 0; i < p.length; i++) if (!(p[i] === q[i] || (p[i] !== p[i] && q[i] !== q[i]))) n++; return n; };
for (const v of want) {
  const chk = fs.existsSync(path.join(R, 'wasm', 'checks', `${v}.mjs`)) ? await import(path.join(R, 'wasm', 'checks', `${v}.mjs`)) : {};
  const affects = chk.affects || [];
  out[v] = { regression: {}, target: null };
  for (const s of scen) {
    // fresh instances per scenario: function statics in handleBuffer survive aud_create (wasm/README section 2)
    const r0 = replay(await A.create('shipped'), s), r1 = replay(await A.create(v), s);
    const n = r0.map((x, i) => ndiff(x, r1[i])), tot = n.reduce((p, q) => p + q, 0);
    out[v].regression[s] = n;
    if (affects.includes(s)) console.log(`INFO [${v}] '${s}' is expected to change: ${n.join('/')} values differ (out/signalIn/signalOut/data)`);
    else T(`[${v}] bit-identical to shipped on '${s}'`, tot === 0, `${n.join('/')} values differ (out/signalIn/signalOut/data)`);
  }
  if (chk.target) {
    const r = await chk.target(A);
    out[v].target = r;
    T(`[${v}] shipped shows the bug`, r.shippedBug, r.shipped);
    T(`[${v}] ${v} does not`, !r.variantBug, r.variant);
  } else T(`[${v}] has a target check`, false, `add report/wasm/checks/${v}.mjs`);
}
const jf = path.join(R, 'wasm', 'check-patches.json');
const prev = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf)) : {};
fs.writeFileSync(jf, JSON.stringify({ ...prev, ...out }, null, 1));   // merge: runs for a subset keep the other variants' results
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exitCode = fails ? 1 : 0;
