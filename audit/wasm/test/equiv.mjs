// Replay native-Octave reference runs (wasm/testdata/<scen>, from harness/oct/wasm_export.m) through the WASM
// build under node and compare output audio, recorded signals and the data matrix sample by sample.
// Usage: node wasm/test/equiv.mjs [variant=full] [scen ...]
// EQUIV_TOL=1: pass within the documented cross-libm tolerance (WASM-2: glibc MEX vs musl/WASM libm) instead of
// requiring bit-exactness: audio <= 1e-9 abs; data columns <= 1e-5 abs or 1e-9 x column max; the LPC-coefficient
// columns (uninitialised before the first voiced frame in every build, WASM-1) are excluded.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AudapterWasm } from '../web/audapter-api.mjs';

const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const variant = process.argv[2] || 'full';
const factory = (await import(path.join(W, 'dist', `audapter-${variant}.mjs`))).default;
const TD = path.join(W, 'testdata');
const scens = process.argv.length > 3 ? process.argv.slice(3) : fs.readdirSync(TD).filter(d => fs.existsSync(path.join(TD, d, 'meta.json')));

const f64 = f => { const b = fs.readFileSync(f); return new Float64Array(b.buffer, b.byteOffset, b.byteLength / 8); };
function cmp(a, b) {
  let maxAbs = 0, nDiff = 0, firstDiff = -1, maxRef = 0, nanMismatch = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    if (Object.is(x, y) || x === y) continue;
    if (Number.isNaN(x) !== Number.isNaN(y)) { nanMismatch++; nDiff++; if (firstDiff < 0) firstDiff = i; continue; }
    if (Number.isNaN(x) && Number.isNaN(y)) continue;
    nDiff++; if (firstDiff < 0) firstDiff = i;
    maxAbs = Math.max(maxAbs, Math.abs(x - y));
  }
  for (let i = 0; i < n; i++) if (Number.isFinite(b[i])) maxRef = Math.max(maxRef, Math.abs(b[i]));
  return { n, lenA: a.length, lenB: b.length, nDiff, firstDiff, maxAbs, maxRef, nanMismatch, exact: nDiff === 0 && a.length === b.length };
}

const results = {};
let allExact = true, allTol = true;
const TOL = process.env.EQUIV_TOL === '1';
for (const s of scens) {
  const meta = JSON.parse(fs.readFileSync(path.join(TD, s, 'meta.json')));
  const a = await AudapterWasm.create(factory);   // fresh wasm instance (also resets handleBuffer's static locals)
  const cmds = meta.cmds; let ci = 0;
  const runCmds = k => {  // replay commands issued before runFrame #k (0-based)
    for (; ci < cmds.length && (cmds[ci].atFrame ?? 0) <= k; ci++) {
      const c = cmds[ci];
      if (c.op === 'setParam') a.setParam(c.name, Array.isArray(c.value) ? c.value : [c.value]);
      else if (c.op === 'ost') a.loadOst(c.text);
      else if (c.op === 'pcf') a.loadPcf(c.text);
      else if (c.op === 'reset') a.reset();
    }
  };
  runCmds(0);
  const xin = f64(path.join(TD, s, 'in.f64')), ref = f64(path.join(TD, s, 'out.f64'));
  const N = meta.frameSize;
  if (a.frameSize() !== N) throw new Error(`${s}: frame size ${a.frameSize()} != ${N}`);
  const out = new Float64Array(xin.length);
  for (let k = 0; k < meta.nFrames; k++) runCmds(k), out.set(a.process(xin.subarray(k * N, (k + 1) * N)), k * N);
  runCmds(Infinity);
  const sig = a.getSignal(), dat = a.getRawData();
  const dump = path.join(W, '..', 'scratch', 'wasm', `wasm-${variant}`, s); fs.mkdirSync(dump, { recursive: true });
  fs.writeFileSync(path.join(dump, 'out.f64'), out); fs.writeFileSync(path.join(dump, 'data.f64'), dat.data);
  fs.writeFileSync(path.join(dump, 'sig.f64'), Buffer.concat([Buffer.from(sig.signalIn.buffer), Buffer.from(sig.signalOut.buffer)]));
  const refSig = f64(path.join(TD, s, 'sig.f64')), refDat = f64(path.join(TD, s, 'data.f64'));
  const r = {
    out: cmp(out, ref),
    signalIn: cmp(sig.signalIn, refSig.subarray(0, meta.sigRows)),
    signalOut: cmp(sig.signalOut, refSig.subarray(meta.sigRows)),
    data: cmp(dat.data, refDat),
  };
  // Per-column breakdown of data differences
  const cols = [];
  for (let j = 0; j < meta.dataCols; j++) {
    const c = cmp(dat.data.subarray(j * meta.dataRows, (j + 1) * meta.dataRows), refDat.subarray(j * meta.dataRows, (j + 1) * meta.dataRows));
    if (c.nDiff) cols.push({ col: j, nDiff: c.nDiff, firstRow: c.firstDiff, maxAbs: c.maxAbs, maxRef: c.maxRef, nanMismatch: c.nanMismatch });
  }
  r.dataCols = cols;
  r.outFirstDiffFrame = r.out.firstDiff >= 0 ? Math.floor(r.out.firstDiff / N) : -1;
  results[s] = r;
  const ex = ['out', 'signalIn', 'signalOut', 'data'].every(k => r[k].exact);
  allExact &&= ex;
  const lpc0 = 4 + 2 * meta.nTracks + 4, lpc1 = lpc0 + meta.nLPC + 1;      // LPC columns [lpc0, lpc1), as AudapterIO reads them (offS:offS+nLPC)
  const tolOk = ['out', 'signalIn', 'signalOut'].every(k => r[k].lenA === r[k].lenB && !r[k].nanMismatch && r[k].maxAbs <= 1e-9) &&
    cols.every(c => (c.col >= lpc0 && c.col < lpc1) || (!c.nanMismatch && (c.maxAbs <= 1e-5 || c.maxAbs <= 1e-9 * c.maxRef)));
  r.withinTolerance = tolOk; allTol &&= tolOk;
  const fmt = c => c.exact ? 'bit-exact' : `${c.nDiff}/${c.n} differ, max|d|=${c.maxAbs.toExponential(2)} (ref max ${c.maxRef.toExponential(2)})${c.nanMismatch ? ` NaN-mismatch ${c.nanMismatch}` : ''}${c.lenA !== c.lenB ? ` LEN ${c.lenA}!=${c.lenB}` : ''}`;
  console.log(`${ex ? 'PASS' : TOL && tolOk ? 'PASS~' : 'DIFF'} ${s.padEnd(11)} out: ${fmt(r.out)} | sigIn: ${fmt(r.signalIn)} | sigOut: ${fmt(r.signalOut)} | data: ${fmt(r.data)}`);
  if (cols.length) console.log(`     data columns differing: ${cols.map(c => `${c.col}(${c.nDiff}, row ${c.firstRow}, ${c.maxAbs.toExponential(1)})`).join(' ')}`);
}
fs.writeFileSync(path.join(W, 'test', `equiv-${variant}.json`), JSON.stringify(results, null, 1));
if (TOL) console.log(allTol ? 'EQUIV: all scenarios within the documented cross-libm tolerance (PASS~ = not bit-exact but within tolerance)' : 'EQUIV: tolerance exceeded');
process.exitCode = (TOL ? allTol : allExact) ? 0 : 1;
