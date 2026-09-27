import fs from 'node:fs';
import { AudapterWasm } from '/home/jmandel/hobby/audapter/audit/wasm/web/audapter-api.mjs';
const factory = (await import('/home/jmandel/hobby/audapter/audit/wasm/dist/audapter-full.mjs')).default;
const s = process.argv[2] || 'tdshift', TD = '/home/jmandel/hobby/audapter/audit/wasm/testdata/' + s;
const meta = JSON.parse(fs.readFileSync(TD + '/meta.json'));
const f64 = f => { const b = fs.readFileSync(f); return new Float64Array(b.buffer, b.byteOffset, b.byteLength / 8); };
const ref = f64(TD + '/data.f64'), R = meta.dataRows;
const a = await AudapterWasm.create(factory);
for (const c of meta.cmds) { if (c.op === 'setParam') a.setParam(c.name, Array.isArray(c.value) ? c.value : [c.value]); else if (c.op === 'ost') a.loadOst(c.text); else if (c.op === 'pcf') a.loadPcf(c.text); else a.reset(); }
const xin = f64(TD + '/in.f64'), N = meta.frameSize;
for (let k = 0; k < meta.nFrames; k++) a.process(xin.subarray(k * N, (k + 1) * N));
const d = a.getData();
const cols = (process.argv[3] || '16,17,18,33').split(',').map(Number);
for (const r of (process.argv[4] || '0,1,2,37,38,39,70').split(',').map(Number)) console.log('row', r, cols.map(j => `c${j} nat=${ref[j * R + r].toPrecision(6)} wasm=${d.data[j * R + r].toPrecision(6)}`).join('  '));
