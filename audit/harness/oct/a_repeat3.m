p = defparams('female'); fs = p.sr * p.downFact;
xa = synth_vowel(fs, 0.5, 200, [850 1220 2810 3800], [80 100 150 200]);
for r = 1:3, d{r} = run_trial(p, xa); end
for r = 2:3
  printf('run %d signalIn identical to run1: %d ; first nonzero in: run1 %d run%d %d\n', r, isequal(d{1}.signalIn, d{r}.signalIn), find(d{1}.signalIn,1), r, find(d{r}.signalIn,1));
  [c, l] = xcorr(d{r}.signalIn, d{1}.signalIn, 200); [~, i] = max(c); printf('  lag of run%d signalIn vs run1: %d samples\n', r, l(i));
  printf('  in(1:6) run1 %s\n  in(1:6) run%d %s\n', mat2str(d{1}.signalIn(1:6)',3), r, mat2str(d{r}.signalIn(1:6)',3));
end
