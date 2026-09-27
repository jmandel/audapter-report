M = corpus_index();
for m = M(ismember({M.source}, {'arctic','pvqd','kearney','vocalset','libri','so762'}))
  [x, fs] = corpus_wav(m); p = defparams(corpus_preset(m));
  if m.sex == 'M' && ~strcmp(m.group,'child'), lo = 60; hi = 300; else, lo = 100; hi = 500; end
  if strcmp(m.group, 'singer_F'), lo = 250; hi = 900; end
  if strcmp(m.group, 'singer_M'), lo = 100; hi = 450; end
  if strcmp(m.group, 'child'), lo = 150; hi = 600; end
  p.bTimeDomainShift = 1; p.pitchLowerBoundHz = lo; p.pitchUpperBoundHz = hi; p.bCepsLift = 1; p.timeDomainPitchShiftSchedule = [0 1; 100 1];
  d = run_trial(p, x); R = corpus_csv([m.root '/ref/' m.id '.praat.csv']);
  ta = ((1:numel(d.pitchHz))' - 0.5) * p.frameLen / p.sr;
  pr = interp1(ta - 0.014, d.pitchHz(:), R(:,1), 'nearest', 0); sp = interp1(ta - 0.014, d.shiftedPitchHz(:), R(:,1), 'nearest', 0); ok = pr > 0 & R(:,2) > 0;
  q = pr(ok) ./ R(ok,2); s = sp(ok & sp > 0) ./ R(ok & sp > 0, 2);
  printf('%-30s %-9s F0ref %5.0f | tracker/ref median %.3f  within5%% %3.0f%%  ~2x %3.0f%%  ~0.5x %3.0f%% | TDS cycle/ref median %.3f within5%% %3.0f%%\n', m.id, m.group, median(R(ok,2)), median(q), 100*mean(abs(q-1)<0.05), 100*mean(abs(q-2)<0.15), 100*mean(abs(q-0.5)<0.07), median(s), 100*mean(abs(s-1)<0.05));
end
