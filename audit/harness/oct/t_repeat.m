% Determinism / cross-trial state leakage through the real AudapterIO path.
p = defparams('female'); fs = p.sr * p.downFact;
xa = synth_vowel(fs, 0.5, 200, [850 1220 2810 3800], [80 100 150 200]);
xi = synth_vowel(fs, 0.5, 200, [310 2790 3310 4000], [80 100 150 200]);
d1 = run_trial(p, xa);
d2 = run_trial(p, xa);            % identical trial again (AudapterIO init + reset)
T('repeat: identical signalOut', isequal(d1.signalOut, d2.signalOut), 'max|diff| %.3g', max(abs(d1.signalOut - d2.signalOut)));
T('repeat: identical fmts', isequal(d1.fmts, d2.fmts), 'max|diff| %.3g Hz', max(abs(d1.fmts(:) - d2.fmts(:))));
d3 = run_trial(p, xi);            % different vowel, then /a/ again
d4 = run_trial(p, xa);
df = abs(d4.fmts(:,1:2) - d1.fmts(:,1:2)); k = find(any(df > 1, 2), 1);
T('leak: /a/ after /i/ == /a/ first (fmts)', isempty(k), 'first diverging frame %d, max diff %.1f Hz', k, max(df(:)));
T('leak: /a/ after /i/ == /a/ first (out)', isequal(d1.signalOut, d4.signalOut), 'max|diff| %.3g', max(abs(d1.signalOut - d4.signalOut)));
save('-binary', '/h/oct/out/t_repeat.mat', 'd1', 'd4');
