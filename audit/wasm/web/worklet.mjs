// AudioWorkletProcessor running the Audapter WASM core on the microphone stream.
// Re-blocks the 128-sample render quantum into Audapter frames (96 samples at 48 kHz): an output FIFO
// pre-filled with (frame - gcd(frame, 128)) = 64 zeros is the minimum that never underruns (1.33 ms at 48 kHz).
import createAudapter from '../dist/audapter-lite.mjs';
import { AudapterWasm } from './audapter-api.mjs';
import DEFAULTS from './audapter-defaults.mjs';
AudapterWasm.DEFAULTS = DEFAULTS;

const now = () => (globalThis.performance ? globalThis.performance.now() : Date.now());
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

class AudapterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = options.processorOptions;
    this.ready = false; this.bypass = false; this.recording = true;
    this.frame = 0; this.underruns = 0; this.quanta = 0;
    this.log = [];                         // [{frame, op, ...}] every command, with the frame index it took effect at
    this.batchFrames = o.batchFrames || 20;
    this.port.onmessage = e => this.onMessage(e.data);
    try {
      const mod = new WebAssembly.Module(o.wasmBytes);   // sync compile is allowed off the main thread
      AudapterWasm.create(createAudapter, { wasmModule: mod }).then(a => {
        this.a = a;
        this.apply({ op: 'init', sex: o.sex || 'female', overrides: o.overrides || {} });
        this.N = a.frameSize();
        const R = 128;
        this.prefill = o.prefill ?? (this.N - gcd(this.N, R));
        this.inQ = new Float32Array(4 * (this.N + R)); this.inLen = 0;
        this.outQ = new Float32Array(4 * (this.N + R)); this.outLen = this.prefill;   // zeros
        this.x = new Float32Array(this.N); this.y = new Float32Array(this.N);
        this.nT = a.getParam('ntracks')[0];
        this.ostCol = 4 + 2 * this.nT + 4 + a.getParam('nlpc')[0] + 2;   // data column of the OST status
        this.resetBatch();
        this.ready = true;
        this.port.postMessage({ type: 'ready', frameSize: this.N, prefill: this.prefill, sampleRate, memMB: a.memoryBytes() / 1048576,
          sizeofAudapter: a.sizeofAudapter(), hasPerformance: !!globalThis.performance, hasTextDecoder: typeof TextDecoder !== 'undefined' });
      }).catch(err => this.port.postMessage({ type: 'error', message: String(err && err.stack || err) }));
    } catch (err) { this.port.postMessage({ type: 'error', message: String(err && err.stack || err) }); }
  }
  apply(c) {
    const a = this.a;
    if (c.op === 'bypass') this.bypass = !!c.on;
    else if (c.op === 'init') { a.init(c.sex, c.overrides); }   // blab defaults + overrides, clears OST/PCF, reset
    else if (c.op === 'reset') a.reset();
    else if (c.op === 'ost') a.loadOst(c.text);
    else if (c.op === 'pcf') a.loadPcf(c.text);
    else a.setParam(c.name, c.value);   // op 'set' (default)
    this.log.push({ frame: this.frame, ...c });
  }
  onMessage(m) {
    try {
      if (m.type === 'cmds') { for (const c of m.cmds) this.apply(c); }
      else if (m.type === 'getLog') this.port.postMessage({ type: 'log', log: this.log, frame: this.frame, underruns: this.underruns });
      else if (m.type === 'record') this.recording = !!m.on;
    } catch (err) { this.port.postMessage({ type: 'error', message: String(err && err.stack || err) }); }
  }
  resetBatch() {
    const B = this.batchFrames, N = this.N;
    this.bIn = new Float32Array(B * N); this.bOut = new Float32Array(B * N);
    this.bRows = new Float64Array(B * 6); this.bN = 0; this.bT = new Float64Array(B); this.bStart = this.frame;
  }
  flush() {
    if (!this.bN) return;
    const n = this.bN, N = this.N;
    const msg = { type: 'chunk', startFrame: this.bStart, n, inp: this.bIn.slice(0, n * N), out: this.bOut.slice(0, n * N),
      rows: this.bRows.slice(0, n * 6), t: this.bT.slice(0, n), underruns: this.underruns, bypass: this.bypass };
    this.port.postMessage(msg, [msg.inp.buffer, msg.out.buffer, msg.rows.buffer, msg.t.buffer]);
    this.bN = 0; this.bStart = this.frame;
  }
  process(inputs, outputs) {
    const out = outputs[0];
    if (!this.ready) { for (const ch of out) ch.fill(0); return true; }
    const R = out[0].length, N = this.N;
    const inp = inputs[0] && inputs[0][0];
    if (inp) this.inQ.set(inp, this.inLen); else this.inQ.fill(0, this.inLen, this.inLen + R);
    this.inLen += R;
    while (this.inLen >= N) {
      this.x.set(this.inQ.subarray(0, N));
      this.inQ.copyWithin(0, N, this.inLen); this.inLen -= N;
      const t0 = now();
      this.a.processF32(this.x, this.y);
      const dt = now() - t0;
      const row = this.a.latest();   // [interval, rms_s, rms_p, rms_o, F1..FnT, rads.., dF1, dF2, sF1, sF2, ...]
      this.outQ.set(this.bypass ? this.x : this.y, this.outLen); this.outLen += N;
      if (this.recording) {
        const k = this.bN;
        this.bIn.set(this.x, k * N); this.bOut.set(this.y, k * N); this.bT[k] = dt;
        const nT = this.nT, base = 4 + 2 * nT + 2;
        this.bRows.set([row[1] ?? 0, row[4] ?? 0, row[5] ?? 0, row[base] ?? 0, row[base + 1] ?? 0, row[this.ostCol] ?? 0], k * 6);
        this.bN++;
        if (this.bN === this.batchFrames) this.flush();
      }
      this.frame++;
    }
    const take = Math.min(R, this.outLen);
    if (take < R) this.underruns++;
    for (const ch of out) { ch.set(this.outQ.subarray(0, take)); if (take < R) ch.fill(0, take); }
    this.outQ.copyWithin(0, take, this.outLen); this.outLen -= take;
    this.quanta++;
    return true;
  }
}
registerProcessor('audapter', AudapterProcessor);
