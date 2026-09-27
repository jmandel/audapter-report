// F6 (a question to the maintainers): glide and dip inputs on the released build and on the alternative build that
// restores upstream 2.1.5's transDone logic. Shows when the field perturbation is applied (sF1 > 0).
AudPanels.register('f6', async function (P) {
  var D = await P.data(), T1 = D.glide.length / 48000, rows = {};
  var segs = function (d) {
    var s = [], v = d.sfmts[0], a = -1;
    for (var i = 0; i <= v.length; i++) { var on = i < v.length && v[i] > 0; if (on && a < 0) a = i; if (!on && a >= 0) { s.push((a / d.frameRate).toFixed(2) + '–' + (i / d.frameRate).toFixed(2)); a = -1; } }
    return s.length ? 'shifted ' + s.join(', ') + ' s' : 'not shifted';
  };
  for (var v of P.variants) {
    P.status('Running both inputs on the ' + (v === 'shipped' ? 'released' : 'alternative') + ' build…');
    var a = await P.instance(v); a.init('female', D.params); var g = a.runTrial({ input: D.glide });
    a.init('female', D.params); var d = a.runTrial({ input: D.dip });
    rows[v] = { g: g, d: d };
  }
  var h = '', lab = { shipped: 'as released', 'alt-f6': 'alternative (upstream)' };
  [['g', 'Glide'], ['d', 'F1 dip']].forEach(function (k) {
    P.variants.forEach(function (v) {
      var r = rows[v][k[0]], on = Array.from(r.sfmts[0], function (x) { return x > 0; });
      h += P.row(k[1], lab[v] || v, P.bars(on, v === 'shipped' ? 'observed' : 'expected', T1, 1 / r.frameRate, 'F1 +20 %'), segs(r),
        function () { P.play(r.signalOut, 16000, 0.98); });
    });
  });
  return h;
});
