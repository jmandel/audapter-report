% Does a PCF loaded in an earlier experiment silently persist across AudapterIO('init')?
p = defparams('female'); fs = p.sr * p.downFact;
x = synth_vowel(fs, 0.8, 120, [850 1220 2810 3800], [80 100 150 200]); g = linspace(0, 5000, 257);
q = p; q.bShift = 1; q.bRatioShift = 1; q.bMelShift = 0; q.F1Min = 0; q.F1Max = 5000; q.F2Min = 0; q.F2Max = 5000; q.LBk = 0; q.LBb = 0;
q.pertF2 = g; q.pertAmp = 0.2*ones(1,257); q.pertPhi = zeros(1,257);
d0 = run_trial(q, x);                                                  % field experiment, fresh session
run_trial(p, x, 'ost', 'cfg/one.ost', 'pcf', '/a/blab/audapter_matlab/example_data/pitch_pert.pcf');   % an earlier PCF experiment
d1 = run_trial(q, x);                                                  % same field experiment again: init only
T('field shift unaffected by earlier PCF (after init)', nnz(d1.sfmts(:,1)) == nnz(d0.sfmts(:,1)), ...
  'shifted frames: fresh %d, after an earlier PCF experiment %d', nnz(d0.sfmts(:,1)), nnz(d1.sfmts(:,1)));
Audapter('ost', '', 0); Audapter('pcf', '', 0);
