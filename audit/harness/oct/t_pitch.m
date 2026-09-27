% Phase-vocoder pitch shift: F0 accuracy and loudness continuity (pitch-time PT-5).
p = defparams('female'); fs = p.sr * p.downFact;
x = synth_vowel(fs, 0.8, 120, [850 1220 2810 3800], [80 100 150 200]); m = round(0.3*p.sr):round(0.7*p.sr);
g = [];
for st = [0 2 -2]
  q = p; q.bPitchShift = 1; q.pitchShiftRatio = 2^(st/12); d = run_trial(q, x);
  f_in = est_f0(d.signalIn, p.sr); f_out = est_f0(d.signalOut, p.sr); g(end+1) = 20*log10(rms(d.signalOut(m))/rms(d.signalIn(m)));
  T(sprintf('pvoc %+d st: F0 accuracy', st), abs(1200*log2(f_out/f_in) - 100*st) < 10, 'cents err %.1f', 1200*log2(f_out/f_in) - 100*st);
end
T('pvoc: unity gain at 0 st', abs(g(1)) < 0.5, 'gain %.2f dB', g(1));
T('pvoc: no loudness step 0 -> +2 st', abs(g(2) - g(1)) < 0.5, 'step %.2f dB', g(2) - g(1));
