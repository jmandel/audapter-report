// Node benchmark: node wasm/test/bench.mjs [variant=full] [seconds=30] [scen ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { benchScenario, fmtRow } from '../web/bench-core.mjs';
const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const variant = process.argv[2] || 'full', seconds = Number(process.argv[3] || 30);
const factory = (await import(path.join(W, 'dist', `audapter-${variant}.mjs`))).default;
const scens = process.argv.length > 4 ? process.argv.slice(4) : ['passthru', 'fmtshift', 'fmtshift2d', 'pvoc', 'tdshift'];
const load = async s => {
  const b = fs.readFileSync(path.join(W, 'testdata', s, 'in.f64'));
  return { meta: JSON.parse(fs.readFileSync(path.join(W, 'testdata', s, 'meta.json'))), input: new Float64Array(b.buffer, b.byteOffset, b.byteLength / 8) };
};
const out = [];
console.log(`node ${process.version}, variant ${variant}`);
for (const s of scens) { const r = await benchScenario(factory, load, s, { seconds, f32: s === 'passthru-f32' }); out.push(r); console.log(fmtRow(r)); }
fs.writeFileSync(path.join(W, 'test', `bench-node-${variant}.json`), JSON.stringify(out, null, 1));
