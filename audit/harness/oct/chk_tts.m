% Quick check: do TTS (gpt-audio-1.5) words behave like real recordings through Audapter at blab defaults?
D = '/h/oct/out/ttstest'; L = dir([D '/*.wav']); hz2mel = @(f) 1127.01048*log(1 + f/700);
printf('%-16s %4s %5s %6s %6s %6s %7s %7s %6s\n', 'clip', 'sex', 'dur', 'trkd', 'onsLag', 'F1', 'F2', 'dF1mel', 'dLev');
for i = 1:numel(L)
  f = L(i).name; fem = any(strfind(f, 'marin')) || any(strfind(f, 'coral')) || any(strfind(f, '_Hw'));
  [y, fs0] = audioread([D '/' f]); y = mean(y, 2); y = resample(y, 48000, fs0);
  W = 960; n = floor(numel(y)/W); e = sqrt(mean(reshape(y(1:n*W), W, n).^2)); act = e > max(e)*10^(-30/20);
  y = y * 0.05 / sqrt(mean(e(act).^2)); ons = (find(act, 1) - 1) * 0.02;
  pad = 0.3; x = [1e-4*randn(round(pad*48000),1); y; 1e-4*randn(round(0.3*48000),1)];
  if fem, base = getAudapterDefaultParams('female'); else, base = getAudapterDefaultParams('male'); end
  g = linspace(0, 5000, 257); base.bShift = 1; base.bRatioShift = 0; base.bMelShift = 1; base.pertF2 = g;
  base.F1Min = 0; base.F1Max = 5000; base.F2Min = 0; base.F2Max = 5000; base.LBk = 0; base.LBb = 0;
  q = base; q.pertAmp = zeros(1,257); q.pertPhi = zeros(1,257); d0 = run_trial(q, x);
  q = base; q.pertAmp = 125*ones(1,257); q.pertPhi = zeros(1,257); d = run_trial(q, x);
  fr = q.frameLen; trk = d0.fmts(:,1) > 0; ft = (find(trk, 1) - 1) * fr / q.sr;
  on = find(d.sfmts(:,1) > 0); m = false(size(d.signalOut)); for k = on', m((k-1)*fr+1:k*fr) = true; end
  printf('%-16s %4s %5.2f %6.2f %6.0f %6.0f %7.0f %7.0f %+6.1f\n', strrep(f, '.wav', ''), report_p2_ifn(fem, 'F', 'M'), sum(act)*0.02, nnz(trk)*fr/q.sr, ...
    1000*(ft - pad - ons), median(d0.fmts(trk,1)), median(d0.fmts(trk,2)), median(hz2mel(d.sfmts(on,1)) - hz2mel(d.fmts(on,1))), ...
    20*log10(rms(d.signalOut(m))/rms(d0.signalOut(m))));
end
