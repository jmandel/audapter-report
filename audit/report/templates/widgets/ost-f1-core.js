// Shared by the in-page widget and the node check (report/wasm/check-ost-f1.mjs).
// Runs trial B, trial A, trial B through one Audapter instance, exactly like report_ost_f1.m.
var OSTF1 = (function () {
  var OST = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n';
  var PCF = '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0.3, 0\n2, 0, 0, 0, 0\n';
  var COL_OST = 33, COL_SF1 = 14, COL_RMS = 1;   // 0-based getData columns (AudapterIO.m layout, nTracks 4, nLPC 15)
  function parseWav(bytes) {                     // PCM16 mono WAV -> Float64Array
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), off = 12, fs = 0;
    while (off < dv.byteLength) {
      var id = String.fromCharCode(dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2), dv.getUint8(off + 3));
      var len = dv.getUint32(off + 4, true);
      if (id === 'fmt ') fs = dv.getUint32(off + 12, true);
      if (id === 'data') {
        var n = len / 2, x = new Float64Array(n);
        for (var i = 0; i < n; i++) x[i] = dv.getInt16(off + 8 + 2 * i, true) / 32768;
        return { fs: fs, x: x };
      }
      off += 8 + len + (len & 1);
    }
    throw new Error('no data chunk');
  }
  // Minimal wrapper over the C API exported by the WASM module (report/wasm/vendor/src/audapter_c.cpp).
  function wrap(M) {
    var f = function (n) { return M['_' + n]; };
    var scratch = f('malloc')(8 * 4096), io = f('malloc')(8 * 4096);
    var chk = function (rc, what) { if (rc < 0) throw new Error('Audapter ' + what + ': ' + M.UTF8ToString(f('aud_last_error')())); return rc; };
    var str = function (s, fn) { var p = M.stringToNewUTF8(s); try { return fn(p); } finally { f('free')(p); } };
    chk(f('aud_create')(), 'create');
    return {
      variant: M.UTF8ToString(f('aud_variant')()),
      setParam: function (name, v) {
        v = typeof v === 'number' ? [v] : v; M.HEAPF64.set(v, scratch >> 3);
        str(name, function (p) { chk(f('aud_set_param')(p, scratch, v.length), 'setParam ' + name); });
      },
      loadOst: function (t) { str(t, function (p) { chk(f('aud_load_ost')(p), 'ost'); }); },
      loadPcf: function (t) { str(t, function (p) { chk(f('aud_load_pcf')(p), 'pcf'); }); },
      reset: function () { chk(f('aud_reset')(), 'reset'); },
      frameSize: function () { return f('aud_frame_size')(); },
      process: function (x) { M.HEAPF64.set(x, io >> 3); chk(f('aud_process')(io, io, x.length), 'process'); },
      getSignal: function () {
        var pp = f('malloc')(8), n = f('aud_get_signal')(pp, pp + 4), pin = M.HEAPU32[pp >> 2], pout = M.HEAPU32[(pp >> 2) + 1];
        f('free')(pp);
        return { signalIn: M.HEAPF64.slice(pin >> 3, (pin >> 3) + n), signalOut: M.HEAPF64.slice(pout >> 3, (pout >> 3) + n) };
      },
      getData: function () {           // {rows, cols, data} column-major, like Audapter(4)
        var pp = f('malloc')(12), rows = f('aud_get_data')(pp, pp + 4, pp + 8);
        var ptr = M.HEAPU32[pp >> 2], cols = M.HEAP32[(pp >> 2) + 1], stride = M.HEAP32[(pp >> 2) + 2];
        f('free')(pp);
        var out = new Float64Array(rows * cols);
        for (var j = 0; j < cols; j++) out.set(M.HEAPF64.subarray((ptr >> 3) + j * stride, (ptr >> 3) + j * stride + rows), j * rows);
        return { rows: rows, cols: cols, data: out };
      }
    };
  }
  function trial(a, x) {
    a.reset();
    var N = a.frameSize(), fr = new Float64Array(N);
    for (var k = 0; k + N <= x.length; k += N) { fr.set(x.subarray(k, k + N)); a.process(fr); }
    var d = a.getData(), s = a.getSignal(), rows = d.rows;
    var col = function (j) { return d.data.subarray(j * rows, (j + 1) * rows); };
    var st = col(COL_OST), first2 = -1;
    for (var i = 0; i < rows; i++) if (st[i] >= 2) { first2 = i; break; }
    return { ost: Array.from(st), sF1: Array.from(col(COL_SF1)), rms: Array.from(col(COL_RMS)),
             state2: first2 < 0 ? null : first2 * 0.002, out: s.signalOut };
  }
  function run(a, initCmds, xA, xB, resetBetween) {
    initCmds.forEach(function (c) { a.setParam(c.name, c.value); });
    a.loadOst(OST); a.loadPcf(PCF);
    var B0 = trial(a, xB), A = trial(a, xA), B1 = trial(a, xB);
    return { B0: B0, A: A, B1: B1 };
  }
  return { parseWav: parseWav, run: run, wrap: wrap, OST: OST, PCF: PCF };
})();
if (typeof module !== 'undefined') module.exports = OSTF1;
