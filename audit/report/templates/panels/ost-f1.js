// OST-F1: trials B, A, B on one instance (as in an experiment loop), released vs fixed build.
AudPanels.register('ost-f1', async function (P) {
  var D = await P.data(), rows = [], T1 = D.trialB.length / 48000;
  var OST = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n';
  var PCF = '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0.3, 0\n2, 0, 0, 0, 0\n';
  var first = function (d, s) { var i = d.ost_stat.findIndex(function (v) { return v >= s; }); return i < 0 ? NaN : i / d.frameRate; };
  for (var v of P.variants) {
    P.status('Running trials B, A, B on the ' + (v === 'shipped' ? 'released' : 'patched') + ' build…');
    var a = await P.instance(v);
    a.init('female', D.params); a.loadOst(OST); a.loadPcf(PCF);
    var b0 = a.runTrial({ input: D.trialB }), A = a.runTrial({ input: D.trialA }), b1 = a.runTrial({ input: D.trialB });
    rows.push({ v: v, b0: b0, b1: b1, A: A });
  }
  var h = P.row('Trial B, first trial', 'expected', P.states(rows[0].b0.ost_stat, 'expected', T1, rows[0].b0.frameRate), 'state 2 at ' + first(rows[0].b0, 2).toFixed(3) + ' s');
  rows.forEach(function (r) {
    h += P.row('Trial B after A', r.v === 'shipped' ? 'as released' : 'with the fix', P.states(r.b1.ost_stat, r.v === 'shipped' ? 'observed' : 'expected', T1, r.b1.frameRate),
      'state 2 at ' + first(r.b1, 2).toFixed(3) + ' s', function () { P.play(r.b1.signalOut, 16000, 0.56); });
  });
  return h;
});
