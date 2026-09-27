// Convert testdata/<scen>/meta.json command stream into the plain-text format read by native/replay.cpp.
import fs from 'node:fs';
const [meta, out] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(meta));
const hex = x => { const b = new DataView(new ArrayBuffer(8)); b.setFloat64(0, x); const h = b.getBigUint64(0);
  // C99 %a-compatible exact hex float
  if (x === 0) return Object.is(x, -0) ? '-0x0p+0' : '0x0p+0'; if (!Number.isFinite(x)) return Number.isNaN(x) ? 'nan' : (x > 0 ? 'inf' : '-inf');
  const s = h >> 63n ? '-' : ''; const e = Number((h >> 52n) & 0x7ffn); const mant = (h & 0xfffffffffffffn).toString(16).padStart(13, '0');
  return e === 0 ? `${s}0x0.${mant}p-1022` : `${s}0x1.${mant}p${e - 1023}`; };
let t = '';
for (const c of m.cmds) {
  const at = c.atFrame ?? 0;
  if (c.op === 'setParam') { const v = Array.isArray(c.value) ? c.value : [c.value]; t += `${at} P ${c.name} ${v.length} ${v.map(hex).join(' ')}\n`; }
  else if (c.op === 'ost' || c.op === 'pcf') { const b = Buffer.from(c.text || ''); t += `${at} ${c.op === 'ost' ? 'O' : 'C'} ${b.length}\n${c.text || ''}\n`; }
  else if (c.op === 'reset') t += `${at} R\n`;
}
fs.writeFileSync(out, t);
