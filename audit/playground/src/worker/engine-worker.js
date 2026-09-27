// Engine worker: one Audapter WASM instance (the bundle text is prepended to this script in a Blob).
// Messages in:  {type:'create'}                               -> {type:'ready', info}
//               {type:'run', id, trials:[{input, settings}], sequence, clearAbsent}
//                                                             -> {type:'progress', id, i, frac} ... {type:'result', id, i, result}
//                                                                {type:'done', id} | {type:'error', id, i, message}
//               {type:'analyse', id, trials:[{input, result}]} (no Audapter needed; used after loading a session)
// "Fresh" trials: the page terminates this worker after one trial, so every fresh trial gets a new instance with
// fresh C++ statics (like a new MATLAB process). Sequences run on one instance without re-creating it.
'use strict';
let A = null, variant = null;
const CHUNK_S = 0.25;

function post(msg, transfer) { self.postMessage(msg, transfer || []); }

async function ensure() {
  if (A) return A;
  const NS = self.Audapter;
  if (!NS) throw new Error('Audapter bundle not loaded in worker');
  variant = NS.variants[0];
  A = await NS.create(variant);
  return A;
}

function info() {
  const i = A.info;
  return { variant: i.variant, patches: i.patches, sizeofAudapter: i.sizeofAudapter, memoryBytes: i.memoryBytes, recorderSeconds: i.recorderSeconds };
}

// Replay captured commands (test cases): setParam / OST / PCF / reset, exactly as the export script sent them.
function applyOps(ops) {
  for (const o of ops || []) {
    if (o.op === 'setParam') A.setParam(o.name, o.value);
    else if (o.op === 'ost') A.loadOst(o.text || '');
    else if (o.op === 'pcf') A.loadPcf(o.text || '');
    else if (o.op === 'reset') A.reset();
  }
}
function apply(settings, seq, clearAbsent) {
  const c = self.PGS.compile(settings);
  A.setParams(c.list);                     // AudapterIO('init') order, values from the settings
  // Fresh instances start with no OST/PCF. In a sequence, a trial without OST/PCF leaves the previous ones loaded,
  // exactly as AudapterIO('init') does (COORD-1), unless the user asked to clear them.
  if (c.ost !== null) A.loadOst(c.ost); else if (!seq || clearAbsent) A.loadOst('');
  if (c.pcf !== null) A.loadPcf(c.pcf); else if (!seq || clearAbsent) A.loadPcf('');
  A.reset();
  return c;
}

// Same as AudapterWasm.processBuffer (whole frames, zero-padded tail) but in chunks, reporting progress.
function processChunked(input, onFrac) {
  const N = A.frameSize(), nF = Math.ceil(input.length / N), len = nF * N;
  const p = A.fn.malloc(8 * len);
  if (!p) throw new Error('out of memory');
  try {
    let h = A.F64; h.fill(0, p >> 3, (p >> 3) + len); h.set(input, p >> 3);
    const step = Math.max(1, Math.round(CHUNK_S * 48000 / N));
    for (let f = 0; f < nF; f += step) {
      const k = Math.min(step, nF - f);
      A.check(A.fn.aud_process_block(p + 8 * f * N, p + 8 * f * N, k), 'process');
      onFrac((f + k) / nF);
    }
    return A.F64.slice(p >> 3, (p >> 3) + input.length);
  } finally { A.fn.free(p); }
}

// Independent analyses of the input and output (spectrograms, YIN F0, LPC formants, level).
function analyse(inp48, r) {
  const D = self.DSP, sIn = r.signalIn, sOut = r.signalOut, sr = 16000;
  const spIn = D.spectrogramDb(sIn, sr), spOut = D.spectrogramDb(sOut, sr);
  const ref = Math.max(D.maxOf(spIn.db), D.maxOf(spOut.db));
  return {
    specIn: D.quantise(spIn, ref), specOut: D.quantise(spOut, ref),
    f0In: D.yin(sIn, sr), f0Out: D.yin(sOut, sr),
    lpcIn: D.lpcFormants(sIn, sr), lpcOut: D.lpcFormants(sOut, sr),
    levIn: D.levelDb(sIn, sr), levOut: D.levelDb(sOut, sr),
    inRms: D.activeRms(inp48), outRms: D.activeRms(r.output), inPeak: D.peak(inp48), outPeak: D.peak(r.output),
    burstDb: D.burstDb(r.output),
  };
}

function pack(d) {   // getData fields -> plain object with typed arrays (copies, so they are transferable)
  const f = a => (a ? Float64Array.from(a) : null), fs = a => (a ? a.map(f) : null);
  return { signalIn: Float64Array.from(d.signalIn), signalOut: Float64Array.from(d.signalOut), frameRate: d.frameRate,
    intervals: f(d.intervals), rms: fs(d.rms), fmts: fs(d.fmts), rads: fs(d.rads), dfmts: fs(d.dfmts), sfmts: fs(d.sfmts),
    rms_slope: f(d.rms_slope), ost_stat: f(d.ost_stat), pitchShiftRatio: f(d.pitchShiftRatio), pitchHz: f(d.pitchHz), shiftedPitchHz: f(d.shiftedPitchHz) };
}
function transferables(r) {
  const t = [];
  const add = a => { if (a && a.buffer && !t.includes(a.buffer)) t.push(a.buffer); };
  for (const v of Object.values(r)) { if (Array.isArray(v)) v.forEach(add); else add(v); }
  if (r.analysis) for (const v of Object.values(r.analysis)) if (v && typeof v === 'object') { add(v.data); add(v.f0); add(v.db); if (v.f) v.f.forEach(add); }
  return t;
}

self.onmessage = async e => {
  const m = e.data;
  try {
    if (m.type === 'create') { await ensure(); post({ type: 'ready', info: info() }); return; }
    if (m.type === 'analyse') {
      m.trials.forEach((t, i) => { const a = analyse(t.input, t.result); post({ type: 'analysis', id: m.id, i, analysis: a }); });
      post({ type: 'done', id: m.id }); return;
    }
    if (m.type === 'run') {
      await ensure();
      if (m.setup) applyOps(m.setup);
      for (let i = 0; i < m.trials.length; i++) {
        const t = m.trials[i], t0 = performance.now();
        post({ type: 'progress', id: m.id, i, frac: 0 });
        try {
          const c = t.ops ? { ost: null, pcf: null, meta: null } : apply(t.settings, !!m.sequence, !!m.clearAbsent);
          if (t.ops) applyOps(t.ops);
          const input = t.input instanceof Float64Array ? t.input : Float64Array.from(t.input);
          const output = processChunked(input, frac => post({ type: 'progress', id: m.id, i, frac }));
          const r = { output, ...pack(A.getData()) };
          r.compiled = { ost: c.ost, pcf: c.pcf, meta: c.meta };
          r.params = { pitchshiftratio: A.getParam('pitchshiftratio')[0], framelen: A.getParam('framelen')[0], srate: A.getParam('srate')[0] };
          r.info = { ...info(), processMs: performance.now() - t0 };
          r.analysis = analyse(input, r);
          r.info.totalMs = performance.now() - t0;
          post({ type: 'result', id: m.id, i, result: r }, transferables(r));
        } catch (err) {
          post({ type: 'error', id: m.id, i, message: String(err && err.message || err) });
          if (!m.sequence) break;
        }
      }
      post({ type: 'done', id: m.id, info: A ? info() : null });
    }
  } catch (err) { post({ type: 'error', id: m.id, message: String(err && err.message || err) }); }
};
