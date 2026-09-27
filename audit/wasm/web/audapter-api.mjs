// JS API over the Audapter WASM C API (src/audapter_c.cpp). Works in node, browser main thread, Web Workers and
// AudioWorkletGlobalScope. Also compiled into the classic-script bundles lib/audapter*.js (see build.sh).
//
//   const a = await AudapterWasm.create(factory);         // factory = default export of dist/audapter-<v>.mjs
//   a.init('female', { bShift: 1, pertAmp: ... });        // blab getAudapterDefaultParams + AudapterIO('init') order
//   const r = a.runTrial({ input, ost, pcf });            // batch: whole Float32Array/Float64Array at 48 kHz
//   r.output, r.signalIn, r.signalOut, r.fmts[0], r.sfmts[0], r.ost_stat, ...
//
// Parameter names are Audapter's setParam names (case-insensitive), e.g. 'bshift', 'pertamp', 'rmsthr'. The
// MATLAB field names used by AudapterIO whose setParam name differs (rmsThresh, dScale, ...) are mapped via PARAM_ALIASES.

// MATLAB p.<field> (getAudapterDefaultParams / AudapterIO) -> Audapter setParam name, where they differ.
export const PARAM_ALIASES = {
  sr: 'srate', dscale: 'scale', preempfact: 'preemp', rmsthresh: 'rmsthr', rmsratiothresh: 'rmsratio',
  rmsforgfact: 'rmsff', dfmtsforgfact: 'dfmtsff', gainadapt: 'bgainadapt', delayframes: 'delayFrames',
};

// Decode the compact defaults format ({fill, n} for constant arrays).
export function decodeValue(v) {
  if (v && Object.getPrototypeOf(v) === Object.prototype && 'fill' in v && 'n' in v) return new Array(v.n).fill(v.fill);
  return v;
}

export class AudapterWasm {
  // Filled by the entry module / bundle: { female: [[name, value], ...], male: [...] } recorded from blab
  // AudapterIO('init', getAudapterDefaultParams(sex)) (harness/oct/wasm_export.m SCEN=defaults_<sex>).
  static DEFAULTS = null;

  constructor(M) {
    this.M = M;
    this.fn = {};
    for (const n of ['aud_create', 'aud_reset', 'aud_set_param', 'aud_get_param', 'aud_load_ost', 'aud_load_pcf',
      'aud_frame_size', 'aud_process', 'aud_process_block', 'aud_process_f32', 'aud_get_signal', 'aud_get_data', 'aud_get_latest',
      'aud_last_error', 'aud_set_verbose', 'aud_sizeof_audapter', 'aud_variant', 'aud_patches', 'aud_max_rec_size',
      'malloc', 'free']) this.fn[n] = M['_' + n];
    this.scratch = this.fn.malloc(8 * 70000);  // big enough for a 257x257 2-D field
    this.io = this.fn.malloc(8 * 4096);
    this.io2 = this.fn.malloc(8 * 4096);
    this.nT = 4; this.nLPC = 15;
  }

  // Each call instantiates a NEW wasm instance (fresh C++ statics; 150-320 MB of memory). Reuse instances.
  static async create(factory, opts = {}) {
    const mopts = { print: opts.print || (() => {}), printErr: opts.printErr || (() => {}) };
    if (opts.wasmModule) {
      // AudioWorklet: no fetch/import of the .wasm; instantiate a pre-compiled module synchronously.
      mopts.instantiateWasm = (imports, done) => {
        const inst = new WebAssembly.Instance(opts.wasmModule, imports);
        done(inst, opts.wasmModule);
        return inst.exports;
      };
    }
    if (opts.wasmBinary) mopts.wasmBinary = opts.wasmBinary;
    if (opts.locateFile) mopts.locateFile = opts.locateFile;
    const M = await factory(mopts);
    const a = new AudapterWasm(M);
    a.check(a.fn.aud_create(), 'create');
    return a;
  }

  get F64() { return this.M.HEAPF64; }  // re-read every time: memory growth detaches old views
  get F32() { return this.M.HEAPF32; }
  err() { return this.M.UTF8ToString(this.fn.aud_last_error()); }
  check(rc, what) { if (rc < 0) throw new Error(`Audapter ${what}: ${this.err()}`); return rc; }
  str(s) { return this.M.stringToNewUTF8(s); }

  get info() {
    return { variant: this.M.UTF8ToString(this.fn.aud_variant()), patches: this.M.UTF8ToString(this.fn.aud_patches()).split(',').filter(Boolean),
      sizeofAudapter: this.fn.aud_sizeof_audapter(), memoryBytes: this.memoryBytes(), frameSize: this.frameSize(),
      recorderSamples: this.fn.aud_max_rec_size(), recorderSeconds: this.fn.aud_max_rec_size() / this.getParam('srate')[0] };
  }

  // ---- parameters
  static paramName(name) { const k = String(name).toLowerCase(); return PARAM_ALIASES[k] || name; }
  setParam(name, value) {
    const v = typeof value === 'number' || typeof value === 'boolean' ? [Number(value)] : Array.from(value, Number);
    const buf = v.length > 70000 ? this.fn.malloc(8 * v.length) : this.scratch;   // e.g. datapb (up to 480000)
    this.F64.set(v, buf >> 3);
    const nm = AudapterWasm.paramName(name);
    const p = this.str(nm);
    try { this.check(this.fn.aud_set_param(p, buf, v.length), `setParam(${nm})`); }
    finally { this.fn.free(p); if (buf !== this.scratch) this.fn.free(buf); }
    const k = nm.toLowerCase();
    if (k === 'ntracks') this.nT = v[0];
    if (k === 'nlpc') this.nLPC = v[0];
  }
  // obj: {name: value} or [[name, value], ...] (order preserved)
  setParams(obj) { for (const [k, v] of Array.isArray(obj) ? obj : Object.entries(obj)) this.setParam(k, decodeValue(v)); }
  getParam(name) {
    const p = this.str(AudapterWasm.paramName(name));
    try {
      const n = this.check(this.fn.aud_get_param(p, this.scratch, 70000), `getParam(${name})`);
      return Array.from(this.F64.subarray(this.scratch >> 3, (this.scratch >> 3) + n));
    } finally { this.fn.free(p); }
  }
  // Apply blab defaults for 'female'|'male' in AudapterIO('init') order, then overrides; clears OST/PCF; resets.
  init(sex = 'female', overrides = {}) {
    const D = AudapterWasm.DEFAULTS;
    if (!D || !D[sex]) throw new Error(`no defaults for '${sex}'`);
    this.setParams(D[sex]);
    this.setParams(overrides);
    this.loadOst(''); this.loadPcf('');
    this.reset();
    return this;
  }
  loadOst(text) { const p = this.str(text || ''); try { this.check(this.fn.aud_load_ost(p), 'ost'); } finally { this.fn.free(p); } }
  loadPcf(text) { const p = this.str(text || ''); try { this.check(this.fn.aud_load_pcf(p), 'pcf'); } finally { this.fn.free(p); } }
  reset() { this.check(this.fn.aud_reset(), 'reset'); }
  frameSize() { return this.fn.aud_frame_size(); }

  // ---- per-frame processing (Audapter('runFrame'))
  process(x) {  // one frame, Float64Array/Float32Array/Array -> new Float64Array
    const n = x.length;
    this.F64.set(x, this.io >> 3);
    this.check(this.fn.aud_process(this.io, this.io2, n), 'process');
    return this.F64.slice(this.io2 >> 3, (this.io2 >> 3) + n);
  }
  processF32(x, out) {  // one frame, Float32 in -> Float32 out (preallocated), no allocation (AudioWorklet)
    const n = x.length;
    this.F32.set(x, this.io >> 2);
    this.check(this.fn.aud_process_f32(this.io, this.io2, n), 'process');
    out.set(this.F32.subarray(this.io2 >> 2, (this.io2 >> 2) + n));
  }
  // ---- batch: whole signal at device rate (48 kHz by default); zero-pads the last partial frame.
  processBuffer(input) {
    const N = this.frameSize(), nF = Math.ceil(input.length / N), len = nF * N;
    const p = this.fn.malloc(8 * len);
    if (!p) throw new Error('out of memory');
    try {
      const h = this.F64; h.fill(0, p >> 3, (p >> 3) + len); h.set(input, p >> 3);
      this.check(this.fn.aud_process_block(p, p, nF), 'processBuffer');
      return this.F64.slice(p >> 3, (p >> 3) + input.length);
    } finally { this.fn.free(p); }
  }
  // One trial like the MATLAB harness run_trial: optional params/OST/PCF, reset, whole input, getData.
  // ost/pcf: file contents as strings ('' or null clears; undefined leaves the current table loaded).
  runTrial({ input, params, ost, pcf, reset = true } = {}) {
    if (params) this.setParams(params);
    if (ost !== undefined) this.loadOst(ost);
    if (pcf !== undefined) this.loadPcf(pcf);
    if (reset) this.reset();
    const output = this.processBuffer(input);
    return { output, ...this.getData() };
  }

  // ---- results (Audapter(4) / AudapterIO('getData') field layout)
  getSignal() {
    const pp = this.fn.malloc(8);
    const n = this.fn.aud_get_signal(pp, pp + 4);
    const pin = this.M.HEAPU32[pp >> 2], pout = this.M.HEAPU32[(pp >> 2) + 1];
    this.fn.free(pp);
    return { signalIn: this.F64.slice(pin >> 3, (pin >> 3) + n), signalOut: this.F64.slice(pout >> 3, (pout >> 3) + n) };
  }
  getRawData() {  // {rows, cols, data: Float64Array column-major} = Audapter(4) dataMat
    const pp = this.fn.malloc(12);
    const rows = this.fn.aud_get_data(pp, pp + 4, pp + 8);
    const ptr = this.M.HEAPU32[pp >> 2], cols = this.M.HEAP32[(pp >> 2) + 1], stride = this.M.HEAP32[(pp >> 2) + 2];
    this.fn.free(pp);
    const out = new Float64Array(rows * cols);
    for (let j = 0; j < cols; j++) out.set(this.F64.subarray((ptr >> 3) + j * stride, (ptr >> 3) + j * stride + rows), j * rows);
    return { rows, cols, data: out };
  }
  // Same fields as AudapterIO('getData') (blab mcode); multi-column fields are arrays of columns.
  getData() {
    const raw = this.getRawData(), R = raw.rows, nT = this.nT, nLPC = this.nLPC;
    const col = j => (j < raw.cols ? raw.data.subarray(j * R, (j + 1) * R) : null);
    const cols = (a, n) => Array.from({ length: n }, (_, i) => col(a + i));
    const o = 4 + 2 * nT + 4 + nLPC + 1;   // skip the LPC coefficients (not returned by AudapterIO; see WASM-1)
    return { ...this.getSignal(), frameRate: this.getParam('srate')[0] / this.getParam('framelen')[0],
      intervals: col(0), rms: cols(1, 3), fmts: cols(4, nT), rads: cols(4 + nT, nT), dfmts: cols(4 + 2 * nT, 2), sfmts: cols(4 + 2 * nT + 2, 2),
      rms_slope: col(o), ost_stat: col(o + 1), pitchShiftRatio: col(o + 2), pitchHz: col(o + 3), shiftedPitchHz: col(o + 4), raw };
  }
  // Most recent data row (all columns): a view into wasm memory valid until the next call (no allocation).
  latest() {
    const n = this.fn.aud_get_latest(this.scratch, 256);
    return this.F64.subarray(this.scratch >> 3, (this.scratch >> 3) + n);
  }
  memoryBytes() { return this.M.wasmMemory ? this.M.wasmMemory.buffer.byteLength : this.M.HEAPF64.buffer.byteLength; }
  sizeofAudapter() { return this.fn.aud_sizeof_audapter(); }
}
