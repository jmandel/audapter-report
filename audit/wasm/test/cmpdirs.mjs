// Compare two result trees (<dir>/<scen>/{out,sig,data}.f64) scenario by scenario.
// The LPC-coefficient columns of the data matrix are compared separately for rows logged before the first
// supra-threshold frame, because they hold uninitialised heap memory there (finding WASM-1).
// Usage: node cmpdirs.mjs <A> <B> [labelA labelB]   (B = reference; meta from wasm/testdata)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [A, B, la = 'A', lb = 'B'] = process.argv.slice(2);
const f64 = f => { const b = fs.readFileSync(f); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const same = (x, y) => Object.is(x, y) || x === y || (Number.isNaN(x) && Number.isNaN(y));
function stat(a, b, mask) {
  let n = 0, nd = 0, mx = 0, mref = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (mask && !mask(i)) continue;
    n++; if (Number.isFinite(b[i])) mref = Math.max(mref, Math.abs(b[i]));
    if (!same(a[i], b[i])) { nd++; mx = Math.max(mx, Math.abs(a[i] - b[i])); }
  }
  return nd === 0 && a.length === b.length ? 'bit-exact' : `${nd}/${n} differ, max|d| ${mx.toExponential(1)} (rel ${(mx / mref).toExponential(1)})`;
}
const summary = {};
for (const s of fs.readdirSync(path.join(W, 'testdata')).sort()) {
  if (!fs.existsSync(path.join(A, s, 'out.f64')) || !fs.existsSync(path.join(B, s, 'out.f64'))) continue;
  const m = JSON.parse(fs.readFileSync(path.join(W, 'testdata', s, 'meta.json')));
  const R = m.dataRows, ai0 = 4 + 2 * m.nTracks + 4, ai1 = ai0 + m.nLPC;
  const dA = f64(path.join(A, s, 'data.f64')), dB = f64(path.join(B, s, 'data.f64'));
  const inited = r => dB[ai0 * R + r] === 1 && dA[ai0 * R + r] === 1;
  const isAi = i => { const c = Math.floor(i / R); return c >= ai0 && c <= ai1; };
  const r = {
    out: stat(f64(path.join(A, s, 'out.f64')), f64(path.join(B, s, 'out.f64'))),
    sig: stat(f64(path.join(A, s, 'sig.f64')), f64(path.join(B, s, 'sig.f64'))),
    data: stat(dA, dB, i => !isAi(i) || inited(i % R)),
    aiUninit: stat(dA, dB, i => isAi(i) && !inited(i % R)),
  };
  summary[s] = r;
  console.log(`${s.padEnd(11)} ${la} vs ${lb}: audio out ${r.out} | recorded sig ${r.sig} | data ${r.data} | uninit-ai rows ${r.aiUninit}`);
}
