// OST-F1: one session per build (trial A, reset(), trial B) on one time axis, and trial B in a fresh session under it.
AudPanels.register('ost-f1', async function (P) {
  var D = await P.data(), TA = D.trialA.length / 48000, TB = D.trialB.length / 48000, T = TA + TB;
  var OST = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n';
  var PCF = '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0.3, 0\n2, 0, 0, 0, 0\n';
  var first = function (d, s) { var i = d.ost_stat.findIndex(function (v) { return v >= s; }); return i < 0 ? NaN : i / d.frameRate; };
  var rows = [];
  P.status('Running trial B in a fresh session…');
  var f0 = await P.instance('shipped'); f0.init('female', D.params); f0.loadOst(OST); f0.loadPcf(PCF);
  var fresh = f0.runTrial({ input: D.trialB }); f0 = null;                // session 2: trial B alone
  for (var v of P.variants) {
    P.status('Running trial A, reset(), trial B on the ' + (v === 'shipped' ? 'current' : 'fixed') + ' build…');
    var a = await P.instance(v);
    a.init('female', D.params); a.loadOst(OST); a.loadPcf(PCF);
    var A = a.runTrial({ input: D.trialA }), B = a.runTrial({ input: D.trialB });
    rows.push({ v: v, A: A, B: B });
  }
  var mark = [{ t: TA }];
  var h = '<p class="ival">Session 1: trial A, then reset() (dashed), then trial B. Session 2: trial B on its own, drawn under trial B.</p>';
  rows.forEach(function (r) {
    h += P.row('Session 1', r.v === 'shipped' ? 'current build' : 'with the fix',
      P.session([{ ost: r.A.ost_stat, frameRate: r.A.frameRate, t0: 0, len: TA, kind: 'context' }, { ost: r.B.ost_stat, frameRate: r.B.frameRate, t0: TA, len: TB, kind: r.v === 'shipped' ? 'observed' : 'expected' }], T, mark),
      'B: state 2 at +' + first(r.B, 2).toFixed(2) + ' s', function () { P.play(r.B.signalOut, 16000, 0.56); });
  });
  h += P.row('Session 2', 'trial B alone', P.session([{ ost: fresh.ost_stat, frameRate: fresh.frameRate, t0: TA, len: TB, kind: 'expected' }], T, mark),
    'B: state 2 at +' + first(fresh, 2).toFixed(2) + ' s', function () { P.play(fresh.signalOut, 16000, 0.56); });
  h += P.row('', '', P.saxis(T, 1, 'time in the session (s); trial B starts at ' + TA.toFixed(1) + ' s'), '', null);
  return h;
});
