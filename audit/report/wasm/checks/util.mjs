// Helpers for patch checks: read harness WAVs, take panel params from the card yaml, OST onset times.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function wav(file) {
  const b = fs.readFileSync(file), dv = new DataView(b.buffer, b.byteOffset, b.byteLength); let off = 12;
  while (off < dv.byteLength) {
    const id = b.toString('latin1', off, off + 4), len = dv.getUint32(off + 4, true);
    if (id === 'data') { const n = len / 2, x = new Float64Array(n); for (let i = 0; i < n; i++) x[i] = dv.getInt16(off + 8 + 2 * i, true) / 32768; return x; }
    off += 8 + len + (len & 1);
  }
  throw new Error('no data chunk in ' + file);
}
// panel params from cards/<ID>.yaml (interactive.params), decoded like templates/widgets/panel.js
export function params(id) {
  const y = JSON.parse(require_yaml(path.join(R, 'cards', id + '.yaml'))).interactive.params || {};
  const o = {};
  for (const [k, v] of Object.entries(y)) {
    if (v && v.linspace) { const [a, b, n] = v.linspace; o[k] = Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1)); }
    else if (v && typeof v === 'object' && 'fill' in v) o[k] = new Array(v.n).fill(v.fill);
    else o[k] = v;
  }
  return o;
}
function require_yaml(f) {   // yaml -> json via python (already a build dependency)
  const { execFileSync } = require_cp();
  return execFileSync('python3', ['-c', 'import sys,yaml,json;print(json.dumps(yaml.safe_load(open(sys.argv[1]))))', f]).toString();
}
import * as cp from 'node:child_process'; function require_cp() { return cp; }
export const first = (d, s) => { const i = d.ost_stat.findIndex(v => v >= s); return i < 0 ? NaN : i / d.frameRate; };
