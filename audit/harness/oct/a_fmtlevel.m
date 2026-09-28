% Independent check of FMT-LEVEL: output level change caused by a formant shift itself, field mode, bGainAdapt 0 (blab default).
clips = {'arctic_bdl_a0030', 'arctic_slt_a0030', 'arctic_bdl_a0005'};
for c = clips
  [x, fs] = audioread(['/a/audit/corpus/audio/' c{1} '.wav']); x = x(:,1);
  g = linspace(0, 5000, 257); base = getAudapterDefaultParams('male'); if strfind(c{1}, 'slt'), base = getAudapterDefaultParams('female'); end
  base.rmsThresh = 0.01; base.bShift = 1; base.bRatioShift = 0; base.bMelShift = 1; base.pertF2 = g; base.F1Min = 0; base.F1Max = 5000; base.F2Min = 0; base.F2Max = 5000; base.LBk = 0; base.LBb = 0;
  q = base; q.pertAmp = zeros(1,257); q.pertPhi = zeros(1,257); d0 = run_trial(q, x);        % no shift
  for s = [1 -1]
    q = base; q.pertAmp = 125*ones(1,257); q.pertPhi = (s < 0)*pi*ones(1,257); d = run_trial(q, x);
    fr = q.frameLen; on = find(d.sfmts(:,1) > 0 & abs(d.sfmts(:,1) - d.fmts(:,1)) > 1); m = false(size(d.signalOut)); for k = on', m((k-1)*fr+1:k*fr) = true; end
    printf('%-18s F1 %+4d mel: shifted %.2f s, level shifted/unshifted %+.2f dB\n', c{1}, 125*s, numel(on)*fr/q.sr, 20*log10(rms(d.signalOut(m))/rms(d0.signalOut(m))));
  end
end
