M = corpus_index(); m = M(strcmp({M.id}, getenv('SCEN'))); [x, fs] = corpus_wav(m); p0 = defparams(corpus_preset(m)); g = linspace(0,5000,257);
lo = 200; hi = 700;
printf('passthrough\n'); fflush(stdout); d0 = run_trial(p0, x);
printf('f0track in\n'); fflush(stdout); tic; fin = corpus_f0track(d0.signalIn, p0.sr, lo, hi); toc
cases = {0.2, 0; 0.2, -pi/2; 0.2*sqrt(2), 3*pi/4};
for c = 1:3
  p = p0; p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0; p.F1Min = 0; p.F1Max = 5000; p.F2Min = 0; p.F2Max = 5000; p.LBk = 0; p.LBb = 0;
  p.pertF2 = g; p.pertAmp = cases{c,1}*ones(1,257); p.pertPhi = cases{c,2}*ones(1,257);
  printf('fmt case %d\n', c); fflush(stdout); tic; d = run_trial(p, x); toc
  printf(' lag\n'); fflush(stdout); tic; [xc, lg_] = xcorr(d.signalOut, d.signalIn, round(0.03*p.sr)); toc
  printf(' est_formants\n'); fflush(stdout); tic; [Fi, te] = est_formants(d.signalIn, p.sr, 'order', 16); toc
end
for st = [0 2 -2]
  p = p0; p.bPitchShift = 1; p.pitchShiftRatio = 2^(st/12); printf('pvoc %d\n', st); fflush(stdout); tic; d = run_trial(p, x); toc
  tic; L = corpus_lag(d.signalIn, d.signalOut, p.sr); toc; tic; fo = corpus_f0track(d.signalOut, p.sr, lo*2^(min(st,0)/12), hi*2^(max(st,0)/12)); toc
end
for fl = [32 64]
  p = p0; p.frameLen = fl; p.nDelay = 5 + 2*(fl == 64); p.bTimeDomainShift = 1; p.pitchLowerBoundHz = lo; p.pitchUpperBoundHz = hi; p.bCepsLift = 1;
  p.timeDomainPitchShiftSchedule = [0, 2^(1/12); 100, 2^(1/12)];
  printf('TDS %d after pvoc\n', fl); fflush(stdout); tic; d = run_trial(p, x); toc
end
