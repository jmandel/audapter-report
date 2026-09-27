// I-01: a masking-noise file shorter than maxPBSize (10 s) in a 12 s trial, released vs looping at the loaded length.
// Noise presence comes from an fb 2 run (noise only, silent input); the Play buttons play the fb 3 run (voice + noise).
// Both use the 48 kHz output runTrial returns for every frame: the lite build's recorder (signalOut) holds 10 s and
// wraps, so for a 12 s trial it would return only the last 2 s.
AudPanels.register('i-01', async function (P) {
  var D = await P.data(), nb = D.babble, vv = D.vowels, FS = 48000, TR = 12, N = TR * FS, dt = 0.01, W = FS * dt;
  var LENS = [3, 5, 7, 9.9];
  // runExperiment.m: zero mean, unit RMS (the export keeps every 3rd sample, the only ones the fb 2-5 loop reads)
  var m = 0, r = 0, i, k;
  for (i = 0; i < nb.length; i++) m += nb[i]; m /= nb.length;
  for (i = 0; i < nb.length; i++) r += (nb[i] - m) * (nb[i] - m); r = Math.sqrt(r / nb.length);
  function noise(L) { var n = Math.round(L * FS), o = new Float64Array(n); for (var j = 0; j < n; j++) o[j] = (nb[Math.floor(j / 3)] - m) / r; return o; }
  var x = new Float64Array(N), voice = [];                       // 0.5 s vowels every second, as report_i01.m
  for (k = 0; k <= 10; k++) { var s0 = (k % 3) * 24000, i0 = Math.round((0.3 + k) * FS); for (i = 0; i < 24000; i++) x[i0 + i] += vv[s0 + i]; }
  for (i = 0; i < TR / dt; i++) { var t = i * dt, u = (t - 0.3) - Math.floor(t - 0.3); voice.push(t >= 0.3 && t < 11.3 && u < 0.5); }
  function present(y) { var o = []; for (var b = 0; b + W <= y.length; b += W) { var e = 0; for (var j = 0; j < W; j++) e += y[b + j] * y[b + j]; o.push(Math.sqrt(e / W) > 1e-4); } return o; }
  function gaps(on) { var g = [], a = null; for (var j = 0; j <= on.length; j++) { var v = j < on.length ? on[j] : true; if (!v && a === null) a = j * dt; if (v && a !== null) { g.push([a, j * dt]); a = null; } } return g; }
  var inst = {};
  for (var v of P.variants) { P.status('Loading the ' + (v === 'shipped' ? 'released' : 'patched') + ' build…'); inst[v] = await P.instance(v); }
  function run(L) {
    var pb = noise(L), res = {};
    P.variants.forEach(function (v) {
      var a = inst[v], o = {};
      a.init('female', Object.assign({}, D.params, { fb: 2 })); a.setParam('datapb', pb); o.on = present(a.runTrial({ input: new Float64Array(N) }).output);
      a.init('female', Object.assign({}, D.params, { fb: 3 })); a.setParam('datapb', pb); o.y = a.runTrial({ input: x }).output;
      o.g = gaps(o.on); res[v] = o;
    });
    return res;
  }
  function show(L) {
    var res = run(L);
    var h = P.row('Voice input', 'a vowel every second', P.bars(voice, 'input', TR, dt, ''), 'fb 3: voice + noise');
    P.variants.forEach(function (v) {
      var o = res[v], txt = o.g.length ? o.g.map(function (g) { return 'gap ' + g[0].toFixed(2) + '–' + g[1].toFixed(2) + ' s'; }).join('<br>') : 'noise throughout';
      h += P.row(v === 'shipped' ? 'As released' : 'With the fix', 'noise present', P.bars(o.on, v === 'shipped' ? 'observed' : 'expected', TR, dt, 'noise'), txt,
        function () { P.play(o.y, FS, 1); });
    });
    return h;
  }
  var id = 'i01' + Math.random().toString(36).slice(2);
  setTimeout(function () {
    var sel = document.getElementById(id + 's'), out = document.getElementById(id + 'r');
    if (sel) sel.addEventListener('change', function () { sel.disabled = true; P.status('Running ' + sel.value + ' s of noise on both builds…');
      setTimeout(function () { var t0 = performance.now(); out.innerHTML = show(Number(sel.value)); sel.disabled = false;
        P.status('Ran in your browser in ' + Math.round(performance.now() - t0) + ' ms.'); }, 20); });
  }, 0);
  P.status('Running 5 s of noise on both builds…');
  return '<p class="ival"><label for="' + id + 's">Length of the noise file (datapb): </label><select id="' + id + 's" style="font: inherit">' +
    LENS.map(function (L) { return '<option value="' + L + '"' + (L === 5 ? ' selected' : '') + '>' + L + ' s</option>'; }).join('') +
    '</select> Trial: 12 s. Play: what the participant hears (fb 3), 12 s.</p><div id="' + id + 'r">' + show(5) + '</div>';
});
