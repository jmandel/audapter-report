// I-02: fb 5 at closedLoopGain 15 and 21 dB (dScale from the bundled calibration), released vs fixed build.
// Each setting runs twice (with and without the playback component) to separate the speech-modulated part.
AudPanels.register('i-02', async function (P) {
  var D = await P.data(), W = 960, dt = 0.02, rows = [];
  var nb = Math.floor(D.input.length / W), T1 = nb * dt;
  var blk = function (s) { var o = new Float64Array(nb); for (var b = 0; b < nb; b++) { var e = 0; for (var i = b * W; i < (b + 1) * W; i++) e += s[i] * s[i]; o[b] = Math.sqrt(e / W); } return o; };
  var bin = blk(D.input), act = Array.from(bin, function (v) { return 20 * Math.log10(v) > -40; });
  var keep = act.map(function (on, b) { return on && act[b - 1] && act[b - 2] && act[b - 3]; });   // skip each vowel's first 60 ms (rms_fb rising)
  function run(a, extra) {
    var q = Object.assign({}, D.params, extra); a.init('female', q); a.setParam('datapb', D.babble); return a.runTrial({ input: D.input });
  }
  for (var v of P.variants) {
    P.status('Running fb 5 on the ' + (v === 'shipped' ? 'released' : 'patched') + ' build…');
    var a = await P.instance(v);
    a.init('female', D.params); var ds0 = a.getParam('scale')[0];            // blab default: closedLoopGain 15 dB, bundled calibration
    [[15, ds0], [21, ds0 * Math.pow(10, 6 / 20)]].forEach(function (c) {
      var t = run(a, { dscale: c[1] }).output, s = run(a, { dscale: c[1], fb5gain_playback: 0 }).output;
      var rs = blk(s), rp = blk(Float64Array.from(t, function (x, i) { return x - s[i]; })), es = 0, ep = 0;
      var ratio = Array.from(rs, function (x, b) { return keep[b] ? 20 * Math.log10(x / rp[b]) : null; });
      act.forEach(function (on, b) { if (on) { es += rs[b] * rs[b]; ep += rp[b] * rp[b]; } });
      rows.push({ v: v, clg: c[0], ds: c[1], ratio: ratio, mix: 10 * Math.log10(es / ep), out: t });
    });
  }
  var h = '<p class="ilab" style="text-align:left">Speech-modulated part re playback part, 20 ms blocks during the vowels (dB)</p>';
  rows.forEach(function (r) {
    h += P.row('closedLoopGain ' + r.clg + ' dB', (r.v === 'shipped' ? 'as released' : 'with the fix') + ', dScale ' + r.ds.toFixed(3),
      P.line(r.ratio, dt, T1, -12, 12, r.v === 'shipped' ? 'observed' : 'expected', [-6, 0, 6], ' dB'),
      'mix ' + (r.mix >= 0 ? '+' : '') + r.mix.toFixed(2) + ' dB', function () { P.play(r.out, 48000, 0.85); });
  });
  var d = function (v) { var x = rows.filter(function (r) { return r.v === v; }); var c = x[1].mix - x[0].mix; return (Math.abs(c) < 0.005 ? 0 : c).toFixed(2); };
  h += '<p class="ival">Change in the mix from 15 to 21 dB: ' + d(P.variants[0]) + ' dB as released, ' + d(P.variants[1]) + ' dB with the fix.</p>';
  return h;
});
