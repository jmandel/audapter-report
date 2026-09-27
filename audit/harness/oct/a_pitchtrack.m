% Independent check of CORPUS-8 on synthetic vowels with known F0: Audapter's logged pitchHz under
% time-domain shifting, default frameLen 32 / nDelay 5 vs 64 / 7. Separate processes per config (fresh tracker).
cfg = str2num(getenv('SCEN'));   % [frameLen nDelay]
p0 = defparams('male'); fs = p0.sr * p0.downFact;
for f0 = [90 110 130 180 220]
  p = p0; p.frameLen = cfg(1); p.nDelay = cfg(2);
  p.bTimeDomainShift = 1; p.pitchLowerBoundHz = 70; p.pitchUpperBoundHz = 300; p.bCepsLift = 1;
  p.timeDomainPitchShiftSchedule = [0, 2^(1/12); 100, 2^(1/12)];
  x = synth_vowel(fs, 0.8, f0, [700 1200 2600 3500], [80 100 150 200]);
  d = run_trial(p, x); v = d.pitchHz(d.pitchHz > 0);
  printf('frameLen %d nDelay %d  F0 %3d: median logged pitchHz %6.1f (ratio %.2f), within 5%%: %3.0f%% of %d voiced frames\n', ...
    cfg(1), cfg(2), f0, median(v), median(v)/f0, 100*mean(abs(v/f0-1) < 0.05), numel(v));
end
