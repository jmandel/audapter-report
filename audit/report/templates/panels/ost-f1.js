// OST-F1: trials 1-5 of the card's mixed design (RMS-floor onset -> INTENSITY_FALL, F1 +125 mel in state 2, catch trial 3)
// as one session per build, trials end to end on one time axis; the value is where trial 4's offset is detected.
AudPanels.register('ost-f1', async function (P) {
  var D = await P.data(), X = [D.t1, D.t2, D.t3, D.t4, D.t5], CATCH = [0, 0, 1, 0, 0], GAP = 0.35;
  var OST = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR 0.2 0.02 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n';
  var ON = '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 125, 0\n3, 0.0, 0, 0, 0\n';
  var OFF = '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n';
  var first = function (d, s) { var i = d.ost_stat.findIndex(function (v) { return v >= s; }); return i < 0 ? NaN : i / d.frameRate; };
  var starts = [], T = 0; X.forEach(function (x) { starts.push(T); T += x.length / 48000 + GAP; }); T -= GAP;
  var h = '<p class="ival">One session per build: trials 1–5 end to end, reset() between trials (dashed). State 2 is the shifted state; state 3 starts at the detected offset of word 1.</p>';
  for (var v of P.variants) {
    P.status('Running trials 1–5 on the ' + (v === 'shipped' ? 'current' : 'fixed') + ' build…');
    var a = await P.instance(v); a.init('female', D.params); a.loadOst(OST);
    var segs = [], R = [];
    for (var k = 0; k < 5; k++) {
      a.loadPcf(CATCH[k] ? OFF : ON);
      var r = a.runTrial({ input: X[k] }); R.push(r);
      segs.push({ ost: r.ost_stat, frameRate: r.frameRate, t0: starts[k], len: X[k].length / 48000, kind: v === 'shipped' ? 'observed' : 'expected' });
    }
    var t4 = first(R[3], 3);
    (function (r4) {
      h += P.row(v === 'shipped' ? 'Current build' : 'With the fix', 'trials 1–5', P.session(segs, T, starts.slice(1).map(function (s) { return { t: s - GAP / 2 }; })),
        'trial 4: offset at ' + (isNaN(t4) ? 'never' : t4.toFixed(2) + ' s'), function () { P.play(r4.signalOut, 16000, 0.5); });
    })(R[3]);
    a = null;
  }
  h += P.row('', '', P.saxis(T, 1, 'time in the session (s)'), '', null);
  return h;
});
