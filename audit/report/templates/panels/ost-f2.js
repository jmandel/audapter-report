// OST-F2: maxIOI fallback + ELAPSED_TIME, three trials on one instance with the OST/PCF loaded once
// (only reset between trials, as in an experiment loop), released vs fixed build. The control row runs the
// intended timing written as two ELAPSED_TIME rules on the released build.
AudPanels.register('ost-f2', async function (P) {
  var D = await P.data(), T1 = D.vowel.length / 48000;
  var OST = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 ELAPSED_TIME 0.1 NaN {}\n3 OST_END NaN NaN {}\n\nn = 1\n0 0.2 2\n';
  var PCF = '0\n\n4\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0, 0\n3, 0, 0, 0.3, 0\n';
  var CTRL = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.2 NaN {}\n1 ELAPSED_TIME 0.1 NaN {}\n2 OST_END NaN NaN {}\n\nn = 0\n';
  var CPCF = '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0.3, 0\n';
  var first = function (d, s) { var i = d.ost_stat.findIndex(function (v) { return v >= s; }); return i < 0 ? NaN : i / d.frameRate; };
  var h = '', rows = [];
  for (var v of P.variants) {
    P.status('Running three trials on the ' + (v === 'shipped' ? 'released' : 'patched') + ' build…');
    var a = await P.instance(v);
    if (v === 'shipped') {
      a.init('female', D.params); a.loadOst(CTRL); a.loadPcf(CPCF);
      var c = a.runTrial({ input: D.vowel }), cs = Array.from(c.ost_stat, function (s) { return s >= 1 ? s + 1 : s; });
      h += P.row('Intended timing', 'control, two ELAPSED_TIME rules', P.states(cs, 'expected', T1, c.frameRate),
        'state 3 (F1 +30 %) at ' + first(c, 2).toFixed(3) + ' s', function () { P.play(c.signalOut, 16000, 4.6); });
    }
    a.init('female', D.params); a.loadOst(OST); a.loadPcf(PCF);
    for (var k = 1; k <= 3; k++) {
      var d = a.runTrial({ input: D.vowel }), s2 = first(d, 2), s3 = first(d, 3);
      rows.push({ v: v, k: k, d: d, s2: s2, s3: s3 });
    }
  }
  rows.forEach(function (r) {
    h += P.row('Trial ' + r.k + (r.k === 1 ? ', OST loaded' : ', no reload'), r.v === 'shipped' ? 'as released' : 'with the fix',
      P.states(Array.from(r.d.ost_stat), r.v === 'shipped' ? 'observed' : 'expected', T1, r.d.frameRate),
      'state 2 at ' + r.s2.toFixed(3) + ' s, held ' + (r.s3 - r.s2).toFixed(3) + ' s', (function (sig) { return function () { P.play(sig, 16000, 4.6); }; })(r.d.signalOut));
  });
  return h;
});
