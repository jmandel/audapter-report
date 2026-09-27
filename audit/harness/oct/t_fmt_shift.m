% Formant perturbation: commanded vs logged (sfmts/fmts) vs heard (independent LPC on signalOut).
p0 = defparams('female'); fs = p0.sr * p0.downFact;
x = synth_vowel(fs, 0.8, 120, [850 1220 2810 3800], [80 100 150 200]);   % /a/, F0 120 (LPC harmonic bias is large at F0 200; see a_f1_overshoot.m)
g = linspace(0, 5000, 257);
base = p0; base.bShift = 1; base.bRatioShift = 1; base.bMelShift = 0;
base.F1Min = 0; base.F1Max = 5000; base.F2Min = 0; base.F2Max = 5000; base.LBk = 0; base.LBb = 0;
base.pertF2 = g; base.pertF1 = g;
cases = {};
% name, param overrides, ost, pcf, expected ratio [F1 F2]
c = base; c.pertAmp = 0.2*ones(1,257); c.pertPhi = zeros(1,257); cases(end+1,:) = {'1D field F1 +20%', c, '', '', [1.2 1]};
c = base; c.pertAmp = 0.2*ones(1,257); c.pertPhi = (pi/2)*ones(1,257); cases(end+1,:) = {'1D field F2 +20%', c, '', '', [1 1.2]};
c = base; c.pertAmp = 0.2*ones(1,257); c.pertPhi = pi*ones(1,257); cases(end+1,:) = {'1D field F1 -20%', c, '', '', [0.8 1]};
c = base; c.bShift2D = 1; c.pertAmp2D = 0.2*ones(257); c.pertPhi2D = zeros(257); cases(end+1,:) = {'2D field F1 +20%', c, '', '', [1.2 1]};
c = base; c.bShift2D = 1; c.pertAmp2D = 0.2*ones(257); c.pertPhi2D = (pi/2)*ones(257); cases(end+1,:) = {'2D field F2 +20%', c, '', '', [1 1.2]};
fid = fopen('cfg/f1up.pcf', 'w'); fprintf(fid, '0\n\n1\n0, 0.0, 0, 0.2, 0\n'); fclose(fid);
c = base; c.pertAmp = zeros(1,257); c.pertPhi = zeros(1,257); cases(end+1,:) = {'PCF F1 +20%', c, 'cfg/one.ost', 'cfg/f1up.pcf', [1.2 1]};
for i = 1:size(cases,1)
  d = run_trial(cases{i,2}, x, 'ost', cases{i,3}, 'pcf', cases{i,4});
  r = shift_measure(cases{i,2}, d, 0.3, 0.8); e = cases{i,5};
  T([cases{i,1} ' (logged)'], all(abs(r.logged - e) < 0.01), 'expect %s logged %s (%d frames)', mat2str(e,3), mat2str(r.logged,3), r.nlogged);
  T([cases{i,1} ' (audio)'], all(abs(r.audio - e) < 0.03), 'expect %s audio %s', mat2str(e,3), mat2str(r.audio,3));
end
Audapter('ost', '', 0); Audapter('pcf', '', 0);
