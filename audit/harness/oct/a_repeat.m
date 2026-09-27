p = defparams('female'); fs = p.sr * p.downFact;
xa = synth_vowel(fs, 0.5, 200, [850 1220 2810 3800], [80 100 150 200]);
for r = 1:4, d{r} = run_trial(p, xa); end
fr = p.frameLen/p.sr;
for r = 2:4
  df = abs(d{r}.fmts(:,1:2) - d{1}.fmts(:,1:2)); bad = find(any(df > 1, 2));
  so = abs(d{r}.signalOut - d{1}.signalOut); bo = find(so > 1e-6);
  printf('run %d vs 1: fmts differ in %d frames (%.3f-%.3f s); out differs in %d samples (%.3f-%.3f s)\n', r, numel(bad), (min(bad)-1)*fr, (max(bad)-1)*fr, numel(bo), min(bo)/p.sr, max(bo)/p.sr);
end
for r=2:3, printf('run%d-vs-run%d fmts diff frames: %d\n', r+1, r, sum(any(abs(d{r+1}.fmts(:,1:2)-d{r}.fmts(:,1:2))>1,2))); end
k = find(any(abs(d{2}.fmts(:,1:2)-d{1}.fmts(:,1:2))>1,2));
disp([k(1:min(12,end)) d{1}.fmts(k(1:min(12,end)),1:2) d{2}.fmts(k(1:min(12,end)),1:2) d{1}.rms(k(1:min(12,end)),1)])
