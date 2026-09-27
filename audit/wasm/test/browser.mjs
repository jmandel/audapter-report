// Headless Chromium test of the demo page with a fake microphone (no real audio hardware):
//  1. start the demo on --use-file-for-fake-audio-capture=test/fake-vowels.wav
//  2. drive the UI API: F1 +20 %, then +2 semitones pitch, then bypass on/off
//  3. pull the worklet's recorded input/output/tracks and command log
//  4. re-run the recorded input offline through the same WASM build in node, applying the logged commands at the
//     logged frame indices, and assert the live output is bit-identical (Float32) to the offline result
//  5. check the captured input is the WAV file content (bit-exact int16/32768), and run the benchmark page.
// Usage: node wasm/test/browser.mjs  (needs /usr/bin/chromium and playwright-core in scratch/wasm/node_modules)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serve } from '../web/server.mjs';
import { AudapterWasm } from '../web/audapter.mjs';   // sets AudapterWasm.DEFAULTS

const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(W, '..', 'scratch', 'wasm', 'package.json'));
const { chromium } = require('playwright-core');
const CHROME = process.env.CHROME || '/usr/bin/chromium';
const WAV = path.join(W, 'test', 'fake-vowels.wav');
const PORT = 8765 + Math.floor(Math.random() * 1000);
let fails = 0;
const T = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ': ' + detail : ''}`); if (!ok) fails++; };

const srv = await serve(PORT);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: [
  '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${WAV}`,
  '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const consoleLines = [];
page.on('console', m => consoleLines.push(m.text()));
page.on('response', r => { if (r.status() >= 400) consoleLines.push(`HTTP ${r.status()} ${r.url()}`); });
page.on('pageerror', e => consoleLines.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${PORT}/web/index.html`);
const version = await browser.version();
const info = await page.evaluate(() => app.start());
console.log('chromium', version, JSON.stringify(info));
const waitFrames = n => page.waitForFunction(k => app.frames() >= k, n, { timeout: 60000 });
const fps = info.ctxRate / info.frameSize;
await waitFrames(Math.round(1.5 * fps));
await page.evaluate(() => app.send(app.shiftCmds(20, 0)));
await waitFrames(Math.round(3.5 * fps));
await page.evaluate(() => app.send([...app.shiftCmds(0, 0), ...app.pitchCmds(2)]));
await waitFrames(Math.round(5.5 * fps));
await page.evaluate(() => app.send([{ op: 'bypass', on: true }]));
await waitFrames(Math.round(6.0 * fps));
await page.evaluate(() => app.send([{ op: 'bypass', on: false }, ...app.pitchCmds(0)]));
await waitFrames(Math.round(7.0 * fps));
const log = await page.evaluate(() => app.getLog());
const rec = await page.evaluate(() => app.recording());
await page.evaluate(() => app.stop());

// ---- offline replay of the live session
const N = rec.frameSize, nF = Math.floor(rec.inp.length / N);
T('recording starts at frame 0 and is contiguous', rec.startFrame === 0 && rec.rows.length === nF, `${nF} frames`);
T('no FIFO underruns (prefill = frame - gcd(frame,128))', rec.underruns === 0, `prefill ${info.prefill}, underruns ${rec.underruns}`);
const factory = (await import(path.join(W, 'dist', 'audapter-lite.mjs'))).default;
const a = await AudapterWasm.create(factory);
let ci = 0; const cmds = log.log;
const x = new Float32Array(N), y = new Float32Array(N);
let nDiff = 0, maxd = 0, rowDiff = 0, firstDiff = -1;
for (let k = 0; k < nF; k++) {
  for (; ci < cmds.length && cmds[ci].frame <= k; ci++) {
    const c = cmds[ci];
    if (c.op === 'init') a.init(c.sex, c.overrides); else if (c.op === 'reset') a.reset(); else if (c.op === 'bypass') {} else if (c.op === 'ost') a.loadOst(c.text); else if (c.op === 'pcf') a.loadPcf(c.text);
    else a.setParam(c.name, c.value);
  }
  x.set(rec.inp.slice(k * N, (k + 1) * N));
  a.processF32(x, y);
  for (let i = 0; i < N; i++) { const d = Math.abs(y[i] - rec.out[k * N + i]); if (d > 0) { nDiff++; if (firstDiff < 0) firstDiff = k; } maxd = Math.max(maxd, d); }
  const row = a.latest(), nT = 4, b = 4 + 2 * nT + 2;
  const want = [row[1], row[4], row[5], row[b], row[b + 1]];
  if (want.some((v, j) => v !== rec.rows[k][j])) rowDiff++;
}
T('live browser output == offline WASM replay (bit-exact float32)', nDiff === 0, `${nDiff} samples differ over ${nF * N}, max |d| ${maxd}, first frame ${firstDiff}`);
T('live formant tracks == offline replay', rowDiff === 0, `${rowDiff} of ${nF} rows differ`);

// ---- the captured mic signal is the WAV content (int16 / 32768), cyclically shifted
const wb = fs.readFileSync(WAV); let off = 12, dataOff = -1, dataLen = 0;
while (off < wb.length) { const id = wb.toString('ascii', off, off + 4), sz = wb.readUInt32LE(off + 4); if (id === 'data') { dataOff = off + 8; dataLen = sz; break; } off += 8 + sz; }
const wavS = new Float32Array(dataLen / 2); for (let i = 0; i < wavS.length; i++) wavS[i] = wb.readInt16LE(dataOff + 2 * i) / 32768;
const inp = Float32Array.from(rec.inp);
// Chromium's fake capture device runs at 44.1 kHz, so a 48 kHz WAV is resampled 48k -> 44.1k -> 48k (AudioContext):
// bit-exactness is impossible; check the waveform instead (normalized cross-correlation at the best integer lag).
// Evaluate 8 segments of 200 ms spread over the session; each gets its own best integer lag.
const L = 9600, segs = [];
for (let q = 0; q < 8; q++) {
  const first = Math.floor(48000 + q * (inp.length - 48000 - L) / 8), seg = inp.subarray(first, first + L);
  const e1 = Math.sqrt(seg.reduce((p, v) => p + v * v, 0));
  if (e1 < 1e-3) continue;
  let best = { lag: -1, r: 0 };
  for (let lag = 0; lag < wavS.length; lag++) {
    let d = 0, e2 = 0;
    for (let i = 0; i < L; i += 2) { const w = wavS[(lag + i) % wavS.length]; d += seg[i] * w; e2 += w * w; }
    const r = d / (Math.sqrt(e1 * e1 / 2) * Math.sqrt(e2) + 1e-20);
    if (r > best.r) best = { lag, r };
  }
  segs.push({ t: first / 48000, lag: best.lag, r: best.r });
}
const rs = segs.map(x => x.r).sort((p, q) => p - q), medR = rs[rs.length >> 1];
const exact = segs;
T('captured input matches the fake-capture WAV (resampled)', medR > 0.99,
  `median xcorr ${medR.toFixed(4)} over ${segs.length} segments (min ${rs[0].toFixed(4)}); lags ${segs.map(x => x.lag).join(',')}; capture track rate ${info.track.sampleRate} Hz`);

// ---- timing inside the AudioWorklet
const ts = rec.times.slice(200).sort((p, q) => p - q);
const tm = ts.reduce((p, q) => p + q, 0) / ts.length;
const budget = 1000 * N / info.ctxRate;
console.log(`worklet per-frame cost: mean ${(tm * 1000).toFixed(1)} us, p50 ${(ts[ts.length >> 1] * 1000).toFixed(1)}, p99 ${(ts[Math.floor(ts.length * 0.99)] * 1000).toFixed(1)}, max ${(ts[ts.length - 1] * 1000).toFixed(1)} us (budget ${(budget * 1000).toFixed(0)} us); timer: ${info.hasPerformance ? 'performance.now' : 'Date.now (1 ms resolution)'}`);
T('worklet per-frame mean cost < 25 % of the frame budget', tm < 0.25 * budget);

// ---- perturbation sanity in the live session: logged sF1/F1 during the +20 % F1 window
const r20 = rec.rows.filter((r, k) => k > 2 * fps && k < 3.4 * fps && r[1] > 0 && r[3] > 0).map(r => r[3] / r[1]);
const med = r20.sort((p, q) => p - q)[r20.length >> 1];
T('live F1 +20 % shift logged as sF1/F1 = 1.2', Math.abs(med - 1.2) < 0.01, `median ${med && med.toFixed(4)} over ${r20.length} voiced frames`);

// ---- main-thread benchmark page (cross-origin isolated -> 5 us timer resolution)
const bp = await browser.newPage();
await bp.goto(`http://127.0.0.1:${PORT}/web/bench.html?variant=full&seconds=${process.env.BENCH_SECONDS || 30}`);
await bp.waitForFunction(() => window.benchResults, null, { timeout: 300000 });
console.log(await bp.evaluate(() => document.getElementById('out').textContent));
const bench = await bp.evaluate(() => window.benchResults);

fs.writeFileSync(path.join(W, 'test', 'browser-result.json'), JSON.stringify({ chromium: version, info, underruns: rec.underruns,
  frames: nF, nDiff, maxd, rowDiff, captureXcorrSnr: exact, worklet: { meanUs: tm * 1000, p99Us: ts[Math.floor(ts.length * 0.99)] * 1000, maxUs: ts[ts.length - 1] * 1000 },
  f1ShiftMedian: med, bench, log: log.log.filter(c => c.frame > 0).map(c => ({ frame: c.frame, op: c.op, name: c.name, v: Array.isArray(c.value) ? c.value[0] : c.value ?? c.on })) }, null, 1));
if (process.env.SAVE_WAV) {  // optional: write the live session as stereo WAV (L in, R out)
  const n = inp.length, b = Buffer.alloc(44 + n * 8);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(info.ctxRate, 24); b.writeUInt32LE(info.ctxRate * 8, 28); b.writeUInt16LE(8, 32); b.writeUInt16LE(32, 34); b.write('data', 36); b.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) { b.writeFloatLE(inp[i], 44 + 8 * i); b.writeFloatLE(rec.out[i], 48 + 8 * i); }
  fs.writeFileSync(process.env.SAVE_WAV, b);
}
if (consoleLines.length) console.log('page console:', consoleLines.slice(0, 10).join(' | '));
await browser.close(); srv.close();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exitCode = fails ? 1 : 0;
