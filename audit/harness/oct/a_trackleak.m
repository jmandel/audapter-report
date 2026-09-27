p = defparams('female'); fs = p.sr * p.downFact;
xa = synth_vowel(fs, 0.4, 120, [850 1220 2810 3800], [80 100 150 200], 'onset', 0, 'ramp', 0.002);
xi = synth_vowel(fs, 0.4, 120, [310 2790 3310 4000], [80 100 150 200], 'onset', 0, 'ramp', 0.002);
d1 = run_trial(p, xa); run_trial(p, xi); d2 = run_trial(p, xa);
df = abs(d2.fmts(:,1:2) - d1.fmts(:,1:2)); k = find(any(df > 0, 2));
printf('frames differing: %d (first %d, last %d), max %.1f Hz\n', numel(k), min([k;0]), max([k;0]), max(df(:)));
if ~isempty(k), disp([k(1:min(6,end)) d1.fmts(k(1:min(6,end)),1:2) d2.fmts(k(1:min(6,end)),1:2)]); end
