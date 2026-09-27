// OST-F2: one session of three trials per build (OST/PCF loaded once, reset() between trials) on one time axis,
// against the intended timing (the same timing written as two ELAPSED_TIME rules).
AudPanels.register('ost-f2', async function (P) {
  var D = await P.data(), T1 = D.vowel.length / 48000, T = 3 * T1;
  var OST = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 ELAPSED_TIME 0.1 NaN {}\n3 OST_END NaN NaN {}\n\nn = 1\n0 0.2 2\n';
  var PCF = '0\n\n4\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0, 0\n3, 0, 0, 0.3, 0\n';
  var CTRL = 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.2 NaN {}\n1 ELAPSED_TIME 0.1 NaN {}\n2 OST_END NaN NaN {}\n\nn = 0\n';
  var CPCF = '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0.3, 0\n';
  var first = function (d, s) { var i = d.ost_stat.findIndex(function (v) { return v >= s; }); return i < 0 ? NaN : i / d.frameRate; };
  var marks = [{ t: T1 }, { t: 2 * T1 }], h = '<p class="ival">Each row is one session: trials 1, 2 and 3 end to end, reset() between them (dashed).</p>';
  P.status('Running the intended timing…');
  var c0 = await P.instance('shipped'); c0.init('female', D.params); c0.loadOst(CTRL); c0.loadPcf(CPCF);
  var cs = [], c;
  for (var k = 0; k < 3; k++) { c = c0.runTrial({ input: D.vowel }); cs.push({ ost: Array.from(c.ost_stat, function (s) { return s >= 1 ? s + 1 : s; }), frameRate: c.frameRate, t0: k * T1, len: T1, kind: 'expected' }); }
  c0 = null;
  h += P.row('Intended', 'every trial alike', P.session(cs, T, marks), 'timeout at ' + first(c, 2).toFixed(2) + ' s', function () { P.play(c.signalOut, 16000, 4.6); });
  for (var v of P.variants) {
    P.status('Running a three-trial session on the ' + (v === 'shipped' ? 'current' : 'fixed') + ' build…');
    var a = await P.instance(v); a.init('female', D.params); a.loadOst(OST); a.loadPcf(PCF);
    var segs = [], t2 = [], last;
    for (var k = 0; k < 3; k++) { last = a.runTrial({ input: D.vowel }); t2.push(first(last, 2).toFixed(2)); segs.push({ ost: Array.from(last.ost_stat), frameRate: last.frameRate, t0: k * T1, len: T1, kind: v === 'shipped' ? 'observed' : 'expected' }); }
    h += P.row('Session', v === 'shipped' ? 'current build' : 'with the fix', P.session(segs, T, marks), 'timeouts at ' + t2.join(' / ') + ' s',
      (function (sig) { return function () { P.play(sig, 16000, 4.6); }; })(last.signalOut));
  }
  h += P.row('', '', P.saxis(T, 0.7, 'time in the session (s); trials start at 0, ' + T1.toFixed(1) + ' and ' + (2 * T1).toFixed(1) + ' s'), '', null);
  return h;
});
