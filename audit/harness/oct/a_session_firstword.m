% Realistic session: same "shift the first word" design on every trial, level-detected only (no fixed times).
% Trials differ in first-word length; separated by reset() only (OST loaded once). Compare two onset rules.
p = defparams('female'); fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0;
V1 = [580 1800 2600 3500]; V2 = [760 1150 2500 3500]; BW = [80 100 150 200];
vow = @(d, F) synth_vowel(fs, d, 200, F, BW, 'onset', 0, 'offset', 0, 'amp', 0.3);
w1 = [0.30 1.20 0.35 0.90 0.30 0.40];                         % first-word durations of the 6 trials
mk = @(d1) [1e-4*randn(round(0.15*fs),1); vow(d1, V1); 1e-4*randn(round(0.25*fs),1); vow(0.5, V2); 1e-4*randn(round(0.3*fs),1)];
fid = fopen('cfg/sess.pcf', 'w'); fprintf(fid, '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 0.3, 0\n3, 0.0, 0, 0, 0\n'); fclose(fid);
designs = {'RISE_HOLD -> FALL', sprintf('rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.01 0.02 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n'); ...
           'blab RMS_FLOOR (mode 32) -> FALL', sprintf('rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR 0.2 0.02 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n')};
for di = 1:2
  fid = fopen('cfg/sess.ost', 'w'); fprintf(fid, '%s', designs{di,2}); fclose(fid);
  printf('\n=== %s  (same OST/PCF on every trial; reset() between trials)\n', designs{di,1});
  AudapterIO('init', p); Audapter('ost', 'cfg/sess.ost', 0); Audapter('pcf', 'cfg/sess.pcf', 0);
  for k = 1:numel(w1)
    d = run_trial(p, mk(w1(k)), 'init', false);          % reset() only, as in an experiment loop
    on = find(d.sfmts(:,1) > 0); t0 = 0.15; t1 = 0.15 + w1(k);
    if isempty(on), printf('trial %d: first word %.2f-%.2f s | shift: NONE\n', k, t0, t1); continue; end
    a = (on(1)-1)*fr; b = on(end)*fr;
    printf('trial %d: first word %.2f-%.2f s | shift %.2f-%.2f s %s\n', k, t0, t1, a, b, ifelse_str(b > t1 + 0.1, '<-- runs past word 1', ''));
  end
end
Audapter('ost', '', 0); Audapter('pcf', '', 0);
