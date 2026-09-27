// In-browser panels: run the real Audapter core (WebAssembly, pinned SHA) as released and patched.
// Progressive enhancement: loaded on click from classic <script> bundles, so they work from file:// and offline.
// Each panel module (templates/panels/<id>.js) calls AudPanels.register(id, async function (ctx) {...}).
var AudPanels = (function () {
  var scripts = {}, shared = {}, registry = {};
  function load(src) {
    if (!scripts[src]) scripts[src] = new Promise(function (ok, bad) {
      var s = document.createElement('script'); s.src = src; s.onload = ok;
      s.onerror = function () { bad(new Error('could not load ' + src)); }; document.head.appendChild(s);
    });
    return scripts[src];
  }
  // One instance per variant; "shipped" is shared by every panel, fix variants are created per run (about 160 MB each).
  async function instance(v) {
    await load('wasm/audapter-' + v + '.js');
    if (v === 'shipped') { shared[v] = shared[v] || Audapter.create(v); return shared[v]; }
    return Audapter.create(v);
  }
  function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function wav(s) {                               // base64 PCM16 mono WAV -> {fs, x: Float64Array}
    var bytes = b64(s), dv = new DataView(bytes.buffer), off = 12, fs = 0;
    while (off < dv.byteLength) {
      var id = String.fromCharCode(dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2), dv.getUint8(off + 3));
      var len = dv.getUint32(off + 4, true);
      if (id === 'fmt ') fs = dv.getUint32(off + 12, true);
      if (id === 'data') { var n = len / 2, x = new Float64Array(n); for (var i = 0; i < n; i++) x[i] = dv.getInt16(off + 8 + 2 * i, true) / 32768; return { fs: fs, x: x }; }
      off += 8 + len + (len & 1);
    }
    throw new Error('no data chunk');
  }
  function param(v) {                            // yaml shorthands: {linspace: [a, b, n]}, {fill: x, n: n}
    if (v && v.linspace) { var a = v.linspace[0], b = v.linspace[1], n = v.linspace[2]; return Array.from({ length: n }, function (_, i) { return a + (b - a) * i / (n - 1); }); }
    if (v && typeof v === 'object' && 'fill' in v) return new Array(v.n).fill(v.fill);
    return v;
  }
  async function data(id) {
    await load('assets/' + id + '/widget-data.js');
    var d = window.AUDAPTER_WIDGETS[id], out = { params: {} };
    Object.keys(d.params || {}).forEach(function (k) { out.params[k] = param(d.params[k]); });
    Object.keys(d.inputs || {}).forEach(function (k) { out[k] = wav(d.inputs[k]).x; });
    return out;
  }
  var ctxA = null, src = null;
  function play(sig, sr, gain) {
    ctxA = ctxA || new AudioContext();
    if (src) try { src.stop(); } catch (e) {}
    var buf = ctxA.createBuffer(1, sig.length, sr), ch = buf.getChannelData(0), g = gain || 1;
    for (var i = 0; i < sig.length; i++) ch[i] = Math.max(-1, Math.min(1, sig[i] * g));
    src = ctxA.createBufferSource(); src.buffer = buf; src.connect(ctxA.destination); src.start();
  }
  // ---- small SVG rows in the report's visual language (same CSS classes as the static sketches)
  var W = 760;
  function svg(h, body) { return '<svg class="itier" viewBox="0 0 ' + W + ' ' + h + '" aria-hidden="true">' + body + '</svg>'; }
  function states(ost, kind, T1, frameRate) {   // one TextGrid-style row of OST states
    var h = 26, parts = [], a = 0, cur = ost[0], dt = 1 / frameRate, x = function (t) { return t / T1 * W; };
    function iv(a, b, s) {
      parts.push('<rect class="sk-' + kind + '" x="' + (x(a) + 1) + '" y="2" width="' + Math.max(x(b) - x(a) - 2, 1) + '" height="' + (h - 4) + '" rx="2"/>');
      if (x(b) - x(a) > 60) parts.push('<text class="sk-in' + (kind === 'observed' ? ' sk-in-observed' : '') + '" x="' + ((x(a) + x(b)) / 2) + '" y="' + (h / 2 + 4) + '" text-anchor="middle">state ' + s + '</text>');
    }
    for (var i = 1; i < ost.length; i++) if (ost[i] !== cur) { iv(a, i * dt, cur); a = i * dt; cur = ost[i]; }
    iv(a, T1, cur);
    return svg(h, parts.join(''));
  }
  function bars(on, kind, T1, dt, label) {       // boolean runs (e.g. "noise present", "shift applied")
    var h = 26, parts = [], a = null, x = function (t) { return t / T1 * W; };
    for (var i = 0; i <= on.length; i++) {
      var v = i < on.length && on[i];
      if (v && a === null) a = i * dt;
      if (!v && a !== null) {
        parts.push('<rect class="sk-' + kind + '" x="' + (x(a) + 1) + '" y="2" width="' + Math.max(x(i * dt) - x(a) - 2, 1) + '" height="' + (h - 4) + '" rx="2"/>');
        if (label && x(i * dt) - x(a) > 50) parts.push('<text class="sk-in' + (kind === 'observed' ? ' sk-in-observed' : '') + '" x="' + ((x(a) + x(i * dt)) / 2) + '" y="17" text-anchor="middle">' + label + '</text>');
        a = null;
      }
    }
    return svg(h, '<rect class="sk-frame" x="0" y="0" width="' + W + '" height="' + h + '"/>' + parts.join(''));
  }
  function line(ys, dt, T1, lo, hi, kind, grid, unit) {   // one continuous trace with hairline grid
    var h = 70, x = function (t) { return t / T1 * W; }, y = function (v) { return h - 4 - (Math.min(Math.max(v, lo), hi) - lo) / (hi - lo) * (h - 8); };
    var g = (grid || []).map(function (v) { return '<line class="sk-grid" x1="0" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="sk-tick" x="4" y="' + (y(v) - 3) + '">' + v + (unit || '') + '</text>'; }).join('');
    var d = '', pen = false;
    for (var i = 0; i < ys.length; i++) { var v = ys[i]; if (v == null || isNaN(v)) { pen = false; continue; } d += (pen ? 'L' : 'M') + x(i * dt).toFixed(1) + ',' + y(v).toFixed(1); pen = true; }
    return svg(h, '<rect class="sk-frame" x="0" y="0" width="' + W + '" height="' + h + '"/>' + g + '<path class="sk-line-' + kind + '" d="' + d + '"/>');
  }
  function row(label, sub, graphic, value, playFn) {
    var id = 'p' + Math.random().toString(36).slice(2);
    if (playFn) setTimeout(function () { var b = document.getElementById(id); if (b) b.addEventListener('click', playFn); }, 0);
    return '<div class="irow"><p class="ilab">' + label + '<br><span>' + sub + '</span></p>' + graphic + '<p class="ival">' + value + '</p>' +
      (playFn ? '<button type="button" class="copy iplay" id="' + id + '">Play</button>' : '<span></span>') + '</div>';
  }
  function register(id, fn) { registry[id] = fn; }
  function wire() {
    document.querySelectorAll('.interactive[data-widget]').forEach(function (panel) {
      var id = panel.dataset.widget, btn = panel.querySelector('button.run'), out = panel.querySelector('.iresult'), status = panel.querySelector('.istatus');
      if (!btn || !registry[id]) return;
      if (typeof WebAssembly !== 'object') { status.textContent = 'This browser cannot run WebAssembly. The figure and recordings above show the same runs.'; btn.disabled = true; return; }
      var label = btn.textContent;
      btn.addEventListener('click', async function () {
        btn.disabled = true; status.textContent = 'Loading the Audapter core…';
        try {
          var t0 = performance.now();
          var html = await registry[id]({ instance: instance, data: function () { return data(id); }, status: function (s) { status.textContent = s; },
            states: states, bars: bars, line: line, row: row, play: play, variants: (panel.dataset.variants || '').split(' ') });
          out.innerHTML = html;
          status.textContent = 'Ran in your browser in ' + Math.round(performance.now() - t0) + ' ms.';
          btn.textContent = 'Run again';
        } catch (e) {
          console.error(e && e.stack || e);
          status.textContent = 'Could not run the in-browser core (' + e.message + '). The static figure and recordings above are unaffected.';
        }
        btn.disabled = false;
      });
    });
  }
  return { register: register, wire: wire };
})();
