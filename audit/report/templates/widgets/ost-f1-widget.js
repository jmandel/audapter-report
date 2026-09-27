// In-browser OST-F1 panel: runs the real Audapter core (WASM, pinned SHA) as released and with the one-line fix.
// Loads lazily on click, from classic <script> bundles so it also works from file:// and offline.
(function () {
  var panel = document.querySelector('.interactive[data-widget="ost-f1"]');
  if (!panel) return;
  var btn = panel.querySelector('button.run'), out = panel.querySelector('.iresult'), status = panel.querySelector('.istatus');
  if (typeof WebAssembly !== 'object') { status.textContent = 'This browser cannot run WebAssembly. The figure and recordings above show the same runs.'; btn.disabled = true; return; }
  function load(src) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { bad(new Error('could not load ' + src)); }; document.head.appendChild(s); }); }
  function blobImport(text) { return import(URL.createObjectURL(new Blob([text], { type: 'text/javascript' }))); }
  function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  var ctx = null;
  function play(sig) {
    ctx = ctx || new AudioContext();
    var buf = ctx.createBuffer(1, sig.length, 16000), ch = buf.getChannelData(0), g = 0.56;   // same gain as the card's clips (-5 dB)
    for (var i = 0; i < sig.length; i++) ch[i] = sig[i] * g;
    var s = ctx.createBufferSource(); s.buffer = buf; s.connect(ctx.destination); s.start();
  }
  function tier(ost, kind, T1) {                 // one TextGrid-style row of OST states, same classes as the static sketch
    var W = 760, X0 = 0, h = 26, dt = 0.002, parts = [], a = 0, cur = ost[0];
    var x = function (t) { return X0 + t / T1 * W; };
    function iv(a, b, s) {
      parts.push('<rect class="sk-' + kind + '" x="' + (x(a) + 1) + '" y="2" width="' + Math.max(x(b) - x(a) - 2, 1) + '" height="' + (h - 4) + '" rx="2"/>');
      if (x(b) - x(a) > 60) parts.push('<text class="sk-in' + (kind === 'observed' ? ' sk-in-observed' : '') + '" x="' + ((x(a) + x(b)) / 2) + '" y="' + (h / 2 + 4) + '" text-anchor="middle">state ' + s + '</text>');
    }
    for (var i = 1; i < ost.length; i++) if (ost[i] !== cur) { iv(a, i * dt, cur); a = i * dt; cur = ost[i]; }
    iv(a, T1, cur);
    return '<svg class="itier" viewBox="0 0 ' + W + ' ' + h + '" aria-hidden="true">' + parts.join('') + '</svg>';
  }
  btn.addEventListener('click', async function () {
    btn.disabled = true; status.textContent = 'Loading the Audapter core (2 builds, about 0.9 MB)…';
    try {
      await Promise.all([load('wasm/audapter-variants.js'), load('assets/ost-f1/widget-data.js')]);
      var W = window.AUDAPTER_WASM, D = window.AUDAPTER_WIDGETS['ost-f1'];
      var xA = OSTF1.parseWav(b64(D.trialA)).x, xB = OSTF1.parseWav(b64(D.trialB)).x;
      var rows = [], t0 = performance.now();
      for (var v of ['buggy', 'patched']) {
        status.textContent = 'Running trials B, A, B through the ' + (v === 'buggy' ? 'released' : 'patched') + ' build…';
        var fac = (await blobImport(W[v].mjs)).default;
        var mod = await WebAssembly.compile(b64(W[v].wasm));
        var M = await fac({ print: function () {}, printErr: function () {}, instantiateWasm: function (imports, done) {
          var inst = new WebAssembly.Instance(mod, imports); done(inst, mod); return inst.exports; } });
        var a = OSTF1.wrap(M);
        rows.push({ v: v, r: OSTF1.run(a, D.init, xA, xB) });
      }
      var ms = performance.now() - t0, T1 = xB.length / 48000;
      var html = '<div class="irow"><p class="ilab">Trial B, first trial<br><span>expected</span></p>' + tier(rows[0].r.B0.ost, 'expected', T1) +
                 '<p class="ival">state 2 at ' + rows[0].r.B0.state2.toFixed(3) + ' s</p><span></span></div>';
      rows.forEach(function (row, k) {
        html += '<div class="irow"><p class="ilab">Trial B after A<br><span>' + (row.v === 'buggy' ? 'as released, 169cadf' : 'with the fix') + '</span></p>' +
                tier(row.r.B1.ost, row.v === 'buggy' ? 'observed' : 'expected', T1) +
                '<p class="ival">state 2 at ' + row.r.B1.state2.toFixed(3) + ' s</p><button type="button" class="copy iplay" data-k="' + k + '">Play</button></div>';
      });
      out.innerHTML = html;
      out.querySelectorAll('.iplay').forEach(function (b) { b.addEventListener('click', function () { play(rows[+b.dataset.k].r.B1.out); }); });
      status.textContent = 'Ran 3 trials on each of 2 builds in your browser in ' + Math.round(ms) + ' ms.';
      btn.textContent = 'Run again'; btn.disabled = false;
    } catch (e) {
      console.error(e && e.stack || e);
      status.textContent = 'Could not run the in-browser core (' + e.message + '). The static figure and recordings above are unaffected.';
      btn.disabled = false;
    }
  });
})();
