// PT-5: the card's 0 -> N st PCF step at 0.6 s on the bundled vowel, released vs overlap-add-normalised build.
// All step sizes are run on the first click (a 1.4 s trial takes a few ms); the selector only switches the display.
AudPanels.register('pt-5', async function (P) {
  var D = await P.data(), x = D.vowel, T1 = x.length / 48000, dt = 0.02, W = 320;
  var OST = 'rmsSlopeWin = 0.030000\n\nn = 2\n0 ELAPSED_TIME 0.6 NaN {}\n1 OST_END NaN NaN {}\n\nn = 0\n';
  var pcf = function (st) { return '0\n\n2\n0, 0, 0, 0, 0\n1, ' + st + ', 0, 0, 0\n'; };
  var STEPS = [{ k: '-2', st: -2, t: '0 → −2 st' }, { k: '1', st: 1, t: '0 → +1 st' }, { k: '2', st: 2, t: '0 → +2 st (the card)' },
               { k: '3', st: 3, t: '0 → +3 st' }, { k: 'off', st: 2, t: 'bPitchShift = 0 (same PCF)' }];
  var blk = function (s) { var o = []; for (var b = 0; b + W <= s.length; b += W) { var e = 0; for (var i = 0; i < W; i++) e += s[b + i] * s[b + i]; o.push(Math.sqrt(e / W)); } return o; };
  var inLev = null, voiced = null;
  function level(d) {                        // 20 ms output level re input (dB), voiced blocks only (as report_pt5.m)
    var bi = blk(d.signalIn), bo = blk(d.signalOut);
    if (!voiced) { var mx = Math.max.apply(null, bi); voiced = bi.map(function (v) { return v > 0.3 * mx; }); }
    return bo.map(function (v, k) { return voiced[k] ? 20 * Math.log10(v / bi[k]) : NaN; });
  }
  function mean(ys, t0, t1) { var s = 0, n = 0; for (var k = Math.round(t0 / dt); k <= Math.round(t1 / dt); k++) if (!isNaN(ys[k])) { s += ys[k]; n++; } return s / n; }
  var R = {}, ref = null, ost = null, fr = null;
  for (var v of P.variants) {
    P.status('Running the step sizes on the ' + (v === 'shipped' ? 'released' : 'patched') + ' build…');
    var a = await P.instance(v); R[v] = {};
    if (!ref) { a.init('female', Object.assign({}, D.params, { bpitchshift: 0 })); ref = a.runTrial({ input: x }); ref.lev = level(ref); }
    for (var s of STEPS) {
      a.init('female', s.k === 'off' ? Object.assign({}, D.params, { bpitchshift: 0 }) : D.params);
      a.loadOst(OST); a.loadPcf(pcf(s.st));
      var d = a.runTrial({ input: x }); d.lev = level(d);
      d.before = mean(d.lev, 0.3, 0.55); d.after = mean(d.lev, 0.8, 1.15);
      if (!ost) { ost = d.ost_stat; fr = d.frameRate; }
      R[v][s.k] = d;
    }
  }
  var sgn = function (z) { if (Math.abs(z) < 0.05) return '0.0'; return (z >= 0 ? '+' : '−') + Math.abs(z).toFixed(1); };
  var GAIN = 1.2;                              // same playback gain for every clip, so loudness differences are real
  function show(k) {
    var h = P.row('OST state', 'PCF: 0 st, then the step', P.states(ost, 'expected', T1, fr), 'step at 0.6 s');
    h += P.row('Reference', 'bPitchShift = 0', P.line(ref.lev, dt, T1, -4.5, 5, 'expected', [-3, 0, 3], ' dB'), sgn(mean(ref.lev, 0.3, 1.15)) + ' dB',
      function () { P.play(ref.signalOut, 16000, GAIN); });
    P.variants.forEach(function (v) {
      var d = R[v][k];
      h += P.row(v === 'shipped' ? 'As released' : 'With the fix', 'level re input, 20 ms', P.line(d.lev, dt, T1, -4.5, 5, v === 'shipped' ? 'observed' : 'expected', [-3, 0, 3], ' dB'),
        'before ' + sgn(d.before) + ' dB<br>after ' + sgn(d.after) + ' dB<br>step ' + sgn(d.after - d.before) + ' dB',
        function () { P.play(d.signalOut, 16000, GAIN); });
    });
    return h;
  }
  var id = 'pt5' + Math.random().toString(36).slice(2);
  setTimeout(function () {
    var sel = document.getElementById(id + 's'), out = document.getElementById(id + 'r');
    if (sel) sel.addEventListener('change', function () { out.innerHTML = show(sel.value); });
  }, 0);
  return '<p class="ival"><label for="' + id + 's">Step at 0.6 s: </label><select id="' + id + 's" style="font: inherit">' +
    STEPS.map(function (s) { return '<option value="' + s.k + '"' + (s.k === '2' ? ' selected' : '') + '>' + s.t + '</option>'; }).join('') +
    '</select> Before = 0.30–0.55 s, after = 0.80–1.15 s (means of 20 ms blocks).</p><div id="' + id + 'r">' + show('2') + '</div>';
});
