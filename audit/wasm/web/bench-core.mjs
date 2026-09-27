// Per-frame processing-cost benchmark, shared by node (test/bench.mjs) and Chromium (web/bench.html).
// load(scen) must return {meta, input: Float64Array}. Replays the scenario's setParam/ost/pcf commands, then
// processes the scenario input repeatedly (seconds of audio) and times every frame.
import { AudapterWasm } from './audapter-api.mjs';

function pct(sorted, p) { return sorted[Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length))]; }

export async function benchScenario(factory, load, scen, { seconds = 30, warmup = 200, f32 = false } = {}) {
  const { meta, input } = await load(scen);
  const a = await AudapterWasm.create(factory);
  for (const c of meta.cmds) {
    if ((c.atFrame ?? 0) > 0) break;
    if (c.op === 'setParam') a.setParam(c.name, Array.isArray(c.value) ? c.value : [c.value]);
    else if (c.op === 'ost') a.loadOst(c.text);
    else if (c.op === 'pcf') a.loadPcf(c.text);
    else if (c.op === 'reset') a.reset();
  }
  const N = meta.frameSize, nIn = meta.nFrames, fs = meta.fs;
  const frameMs = N / fs * 1000;
  const total = Math.round(seconds * fs / N);
  const t = new Float64Array(total);
  const x32 = new Float32Array(N), y32 = new Float32Array(N);
  for (let k = 0; k < warmup + total; k++) {
    const fr = input.subarray((k % nIn) * N, (k % nIn + 1) * N);
    let t0, t1;
    if (f32) { x32.set(fr); t0 = performance.now(); a.processF32(x32, y32); t1 = performance.now(); }
    else { t0 = performance.now(); a.process(fr); t1 = performance.now(); }
    if (k >= warmup) t[k - warmup] = t1 - t0;
  }
  const s = Array.from(t).sort((p, q) => p - q);
  const mean = t.reduce((p, q) => p + q, 0) / total;
  // reset() cost: zeroes all recorder/delay buffers (~266 MB full build)
  const r0 = performance.now(); a.reset(); const r1 = performance.now(); a.reset(); const r2 = performance.now();
  return {
    scen, frameSize: N, fs, frameMs, frames: total,
    meanUs: mean * 1000, p50Us: pct(s, 50) * 1000, p99Us: pct(s, 99) * 1000, p999Us: pct(s, 99.9) * 1000, maxUs: s[s.length - 1] * 1000,
    loadPct: 100 * mean / frameMs, overBudget: t.filter(v => v > frameMs).length,
    resetMs: [r1 - r0, r2 - r1], memMB: a.memoryBytes() / 1048576,
  };
}

export function fmtRow(r) {
  return `${r.scen.padEnd(11)} N=${r.frameSize} (${r.frameMs.toFixed(2)} ms): mean ${r.meanUs.toFixed(1)} us, p50 ${r.p50Us.toFixed(1)}, ` +
    `p99 ${r.p99Us.toFixed(1)}, p99.9 ${r.p999Us.toFixed(1)}, max ${r.maxUs.toFixed(0)} us; load ${r.loadPct.toFixed(1)} % of real time; ` +
    `${r.overBudget} frames over budget; reset ${r.resetMs.map(v => v.toFixed(1)).join('/')} ms; mem ${r.memMB.toFixed(0)} MB`;
}
