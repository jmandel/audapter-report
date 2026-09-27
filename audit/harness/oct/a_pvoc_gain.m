p = defparams('female'); fs = p.sr * p.downFact;
x = synth_vowel(fs, 0.8, 120, [850 1220 2810 3800], [80 100 150 200]);
for r = [1 2^(2/12)]
  q = p; q.bPitchShift = 1; q.pitchShiftRatio = r; d = run_trial(q, x);
  m = (0.3*p.sr):(0.7*p.sr); printf('pvoc ratio %.3f: out/in rms = %.3f (%.2f dB); F0 in %.1f out %.1f\n', r, rms(d.signalOut(m))/rms(d.signalIn(m)), 20*log10(rms(d.signalOut(m))/rms(d.signalIn(m))), est_f0(d.signalIn, p.sr), est_f0(d.signalOut, p.sr));
end
d = run_trial(p, x); printf('no pitch shift: out/in rms = %.3f\n', rms(d.signalOut(m))/rms(d.signalIn(m)));
