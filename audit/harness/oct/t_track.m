% Formant tracking accuracy on synthetic vowels; also validates the independent estimator.
p = defparams('female'); fs = p.sr * p.downFact;
V = {'a', [850 1220 2810 3800]; 'i', [310 2790 3310 4000]; 'u', [370 950 2670 3700]; 'ae', [860 2050 2850 3900]};
BW = [80 100 150 200];
for v = 1:size(V,1)
  Ft = V{v,2}; x = synth_vowel(fs, 0.6, 210, Ft, BW);
  d = run_trial(p, x);
  fr = p.frameLen / p.sr; tt = (0:size(d.fmts,1)-1)' * fr;
  mid = tt > 0.25 & tt < 0.55;
  fa = median(d.fmts(mid, 1:2)); 
  [Fe, te] = est_formants(d.signalIn, p.sr); fe = median(Fe(te > 0.25 & te < 0.55, :), 'omitnan');
  T(sprintf('track /%s/ F1 vs indep LPC', V{v,1}), abs(fa(1)-fe(1))/fe(1) < 0.05, 'true %d audapter %.0f indep %.0f', Ft(1), fa(1), fe(1));
  T(sprintf('track /%s/ F2 vs indep LPC', V{v,1}), abs(fa(2)-fe(2))/fe(2) < 0.05, 'true %d audapter %.0f indep %.0f', Ft(2), fa(2), fe(2));
end
