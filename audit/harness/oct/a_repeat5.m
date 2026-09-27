p = defparams('female'); fs = p.sr * p.downFact; N = p.frameLen*p.downFact;
xa = synth_vowel(fs, 0.5, 200, [850 1220 2810 3800], [80 100 150 200]);
d = run_trial(p, xa);
for trial = 1:3
  Audapter('reset');
  for k = 1:6
    Audapter('runFrame', 0.1*ones(N,1));
    [s, dm] = Audapter(4);
    printf('trial %d after frame %d: rec len %d, nonzero in-samples %d, data rows %d\n', trial, k, size(s,1), nnz(s(:,1)), size(dm,1));
  end
end
