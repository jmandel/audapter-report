'use strict';
// Engine client: runs trials in Web Workers, one Audapter WASM instance per worker.
// Fresh trials: a worker (with a new instance) runs ONE trial and is then terminated, so memory is returned and the next
// trial starts from fresh C++ state. A spare worker is pre-created after each termination to hide the ~0.2 s start-up,
// so at most one instance is alive at a time. Sequences: one fresh worker runs all trials in order, then is terminated.
PG.Engine = (() => {
  const blobs = {}, spares = {}, scripts = {};
  let active = null, analysisWorker = null;
  const stats = { peakWasmBytes: 0, lastWasmBytes: 0, instancesCreated: 0, mode: 'worker' };
  const HANG_MS = 12000;

  function loadScript(v) {
    if (self.PG_ENGINE_FN && PG_ENGINE_FN[v]) return Promise.resolve();
    if (!scripts[v]) scripts[v] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = `engine/engine-${v}.js`;
      s.onload = () => (self.PG_ENGINE_FN && PG_ENGINE_FN[v] ? res() : rej(new Error(`engine ${v} did not register`)));
      s.onerror = () => { delete scripts[v]; rej(new Error(`could not load engine/engine-${v}.js`)); };
      document.head.append(s);
    });
    return scripts[v];
  }
  async function blobUrl(v) {
    if (blobs[v]) return blobs[v];
    await loadScript(v);
    blobs[v] = URL.createObjectURL(new Blob(['(', PG_ENGINE_FN[v].toString(), ')();\n', PG.WORKER_SRC], { type: 'text/javascript' }));
    return blobs[v];
  }
  async function spawn(v) {
    const url = await blobUrl(v);
    const w = new Worker(url);
    stats.instancesCreated++;
    const ready = new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('engine start-up timed out')), 30000);
      w.addEventListener('message', function f(e) { if (e.data.type === 'ready') { clearTimeout(t); w.removeEventListener('message', f); res(e.data.info); } else if (e.data.type === 'error') { clearTimeout(t); rej(new Error(e.data.message)); } });
      w.addEventListener('error', e => { clearTimeout(t); rej(new Error(e.message || 'worker failed to start')); }, { once: true });
    });
    w.postMessage({ type: 'create' });
    ready.then(i => note(i)).catch(() => {});
    return { w, ready, v };
  }
  function note(info) { if (info && info.memoryBytes) { stats.lastWasmBytes = info.memoryBytes; stats.peakWasmBytes = Math.max(stats.peakWasmBytes, info.memoryBytes); PG.bus.emit('engine-stats', stats); } }
  async function take(v) {
    const s = spares[v]; delete spares[v];
    return s || spawn(v);
  }
  function prewarm(v) {
    if (spares[v] || stats.mode !== 'worker') return;
    setTimeout(() => { if (!spares[v] && !active) spawn(v).then(s => { if (spares[v] || active) { s.w.terminate(); return; } spares[v] = s; }).catch(() => {}); }, 150);
  }
  function dropSpares(except) { for (const k of Object.keys(spares)) if (k !== except) { spares[k].w.terminate(); delete spares[k]; } }

  // Run trials. opts: {variant, trials:[{input, settings}], sequence, clearAbsent, onProgress(i, frac), onResult(i, result)}
  let running = false;
  async function run(opts) {
    if (running) throw new Error('a run is already in progress');
    running = true;
    try { return await run1(opts); } finally { running = false; }
  }
  async function run1(opts) {
    const { variant, trials, sequence } = opts;
    if (stats.mode === 'main') return runMain(opts);
    dropSpares(variant);
    const results = new Array(trials.length).fill(null), errors = [];
    const groups = sequence ? [trials.map((t, i) => i)] : trials.map((t, i) => [i]);
    try {
      for (const g of groups) {
        let slot;
        try { slot = await take(variant); await slot.ready; }
        catch (e) { if (slot) slot.w.terminate(); if (/Worker|script|blob|security/i.test(String(e.message)) || !stats.instancesCreated) { stats.mode = 'main'; return runMain(opts); } throw e; }
        await new Promise((resolve, reject) => {
          const id = PG.uid(); let beat = performance.now();
          active = { slot, reject, id };
          const dog = setInterval(() => {
            if (performance.now() - beat > HANG_MS) {
              clearInterval(dog); slot.w.terminate(); active = null;
              reject(Object.assign(new Error(`Audapter stopped responding (no progress for ${HANG_MS / 1000} s); the worker was terminated. An endless loop in the formant tracker is a known failure after frameLen/nDelay changes in one session (CORPUS-10).`), { hang: true }));
            }
          }, 500);
          slot.w.onmessage = e => {
            const m = e.data; beat = performance.now();
            if (m.id !== id) return;
            const gi = g[m.i ?? 0];
            if (m.type === 'progress') opts.onProgress && opts.onProgress(gi, m.frac);
            else if (m.type === 'result') { results[gi] = m.result; note(m.result.info); opts.onResult && opts.onResult(gi, m.result); }
            else if (m.type === 'error') { errors.push({ i: gi, message: m.message }); opts.onError && opts.onError(gi, m.message); }
            else if (m.type === 'done') { clearInterval(dog); resolve(); }
          };
          slot.w.onerror = e => { clearInterval(dog); reject(new Error(e.message || 'engine worker crashed')); };
          const payload = g.map(i => ({ input: trials[i].input, settings: trials[i].settings, ops: trials[i].ops }));
          slot.w.postMessage({ type: 'run', id, trials: payload, sequence: !!sequence, clearAbsent: !!opts.clearAbsent, setup: opts.setup });
        });
        slot.w.terminate(); active = null;
      }
    } finally { if (active) { active.slot.w.terminate(); active = null; } prewarm(variant); }
    return { results, errors };
  }
  function cancel() {
    if (!active) return false;
    active.slot.w.terminate(); const r = active.reject; active = null;
    r(Object.assign(new Error('Stopped.'), { cancelled: true })); return true;
  }

  // Fallback without workers (e.g. a browser that refuses Blob workers on file://): one instance on the main thread.
  let mainInst = {};
  async function runMain(opts) {
    await loadScript(opts.variant);
    if (!self.Audapter || !Audapter.factories[opts.variant]) PG_ENGINE_FN[opts.variant]();
    const A = mainInst[opts.variant] || (mainInst[opts.variant] = await Audapter.create(opts.variant));
    const results = [], errors = [];
    for (let i = 0; i < opts.trials.length; i++) {
      const t = opts.trials[i];
      try {
        await new Promise(r => setTimeout(r, 0));
        const c = PG.S.compile(t.settings);
        if (!opts.sequence) { A.loadOst(''); A.loadPcf(''); }
        A.setParams(c.list);
        if (c.ost !== null) A.loadOst(c.ost); else if (!opts.sequence || opts.clearAbsent) A.loadOst('');
        if (c.pcf !== null) A.loadPcf(c.pcf); else if (!opts.sequence || opts.clearAbsent) A.loadPcf('');
        A.reset();
        const t0 = performance.now(), output = A.processBuffer(t.input), d = A.getData();
        const r = { output, ...d, compiled: { ost: c.ost, pcf: c.pcf, meta: c.meta }, info: { ...A.info, processMs: performance.now() - t0, mainThread: true } };
        r.analysis = PG.analyseMain(t.input, r);
        results[i] = r; note(r.info); opts.onResult && opts.onResult(i, r);
      } catch (e) { errors.push({ i, message: e.message }); opts.onError && opts.onError(i, e.message); }
    }
    return { results, errors };
  }

  // Analyses for trials loaded from a saved session (no Audapter instance needed).
  function analyse(items) {
    if (!analysisWorker) {
      try { analysisWorker = new Worker(URL.createObjectURL(new Blob([PG.WORKER_SRC], { type: 'text/javascript' }))); }
      catch { return Promise.resolve(items.map(t => PG.analyseMain(t.input, t.result))); }
    }
    return new Promise(res => {
      const id = PG.uid(), out = [];
      analysisWorker.onmessage = e => { if (e.data.id !== id) return; if (e.data.type === 'analysis') out[e.data.i] = e.data.analysis; if (e.data.type === 'done') res(out); };
      analysisWorker.postMessage({ type: 'analyse', id, trials: items.map(t => ({ input: t.input, result: { signalIn: t.result.signalIn, signalOut: t.result.signalOut, output: t.result.output } })) });
    });
  }
  // Dry run for the timing designer: Audapter's own per-frame level (rms_s, rms_p, slope) on this input, no OST/PCF.
  const dryCache = new Map();
  async function dryRun(input, settings) {
    const s = PG.S.normalize(PG.S.clone(settings));
    s.when.mode = 'always'; for (const k of Object.keys(s.shift)) s.shift[k].on = false; s.hear.fb = 1;
    const key = input.id + '|' + JSON.stringify([s.preset, s.listen, s.raw, s.build]);
    if (dryCache.has(key)) return dryCache.get(key);
    while (running) await new Promise(r => setTimeout(r, 120));
    const { results } = await run({ variant: s.build || 'lite', trials: [{ input: input.x, settings: s }] });
    const r = results[0]; if (!r) throw new Error('dry run failed');
    const m = PG.S.compile(s).meta;
    const out = { rms: r.rms[0], rmsP: r.rms[1], slope: r.rms_slope, fmts: [r.fmts[0], r.fmts[1]], frameDur: m.frameLen / m.sr, n: r.rms[0].length };
    if (dryCache.size > 20) dryCache.clear();
    dryCache.set(key, out); return out;
  }
  return { run, cancel, analyse, stats, prewarm, dryRun, busy: () => running, loadScript };
})();

PG.analyseMain = (inp48, r) => {
  const D = PG.DSP, sr = 16000, spIn = D.spectrogramDb(r.signalIn, sr), spOut = D.spectrogramDb(r.signalOut, sr);
  const ref = Math.max(D.maxOf(spIn.db), D.maxOf(spOut.db));
  return { specIn: D.quantise(spIn, ref), specOut: D.quantise(spOut, ref), f0In: D.yin(r.signalIn, sr), f0Out: D.yin(r.signalOut, sr),
    lpcIn: D.lpcFormants(r.signalIn, sr), lpcOut: D.lpcFormants(r.signalOut, sr), levIn: D.levelDb(r.signalIn, sr), levOut: D.levelDb(r.signalOut, sr),
    inRms: D.activeRms(inp48), outRms: D.activeRms(r.output), inPeak: D.peak(inp48), outPeak: D.peak(r.output), burstDb: D.burstDb(r.output) };
};
