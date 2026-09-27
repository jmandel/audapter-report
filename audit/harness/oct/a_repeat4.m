p = defparams('female'); fs = p.sr * p.downFact;
xa = synth_vowel(fs, 0.5, 200, [850 1220 2810 3800], [80 100 150 200]);
z = @(d) find(d.signalIn, 1) - 1;
d = run_trial(p, xa); printf('first run: leading zeros %d, len %d\n', z(d), numel(d.signalIn));
d = run_trial(p, xa, 'init', false); printf('reset only: leading zeros %d len %d\n', z(d), numel(d.signalIn));
d = run_trial(p, xa, 'init', false); printf('reset only again: leading zeros %d\n', z(d));
d = run_trial(p, xa); printf('init+reset: leading zeros %d\n', z(d));
d = run_trial(p, xa); printf('init+reset: leading zeros %d\n', z(d));
AudapterIO('init', p); d = run_trial(p, xa, 'init', false); printf('init; reset (separately): %d\n', z(d));
