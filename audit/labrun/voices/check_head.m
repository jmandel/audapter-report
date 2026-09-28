% Voice-bank check: AI-generated "head" takes vs real "head" recordings (Hillenbrand et al. 1995, restricted, local only)
% under the lab's formant settings: getAudapterDefaultParams(gender), field mode, F1 +-125 mel (bMelShift 1, bGainAdapt 0 as
% sent), as in coAdapt/attentionComp. Per token: Audapter's tracked F1/F2 (median over voiced frames), and the output level
% of the shifted trial re the unshifted trial of the same token over the frames Audapter logged as shifted (as a_fmtlevel.m).
% TOKS = ':'-separated "path,gender,source" entries. Run with the harness (audit/harness/run-oct.sh style mounts).
1;
function r = ifelse_(c, a, b)
if c, r = a; else, r = b; end
end
T = strsplit(getenv('TOKS'), ':');
printf('source\ttoken\tgender\tF1\tF2\tshifted_s_up\tup_dB\tshifted_s_down\tdown_dB\n');
for i = 1:numel(T)
  q = strsplit(T{i}, ','); [x, fx] = audioread(q{1}); x = mean(x, 2);
  if fx ~= 48000, x = resample(x, 48000, fx); end
  x = [zeros(round(0.3*48000), 1); x / sqrt(mean(x(abs(x) > 0.1*max(abs(x))).^2)) * 0.05; zeros(round(0.3*48000), 1)];
  base = getAudapterDefaultParams(ifelse_(q{2} == 'M', 'male', 'female'));
  base.bShift = 1; base.bRatioShift = 0; base.bMelShift = 1; base.pertF2 = linspace(0, 5000, 257);
  base.F1Min = 0; base.F1Max = 5000; base.F2Min = 0; base.F2Max = 5000; base.LBk = 0; base.LBb = 0;
  p = base; p.pertAmp = zeros(1, 257); p.pertPhi = zeros(1, 257); d0 = run_trial(p, x);
  v = d0.fmts(:, 1) > 0; F = median(d0.fmts(v, 1:2), 1);
  out = [];
  for s = [1 -1]
    p = base; p.pertAmp = 125 * ones(1, 257); p.pertPhi = (s < 0) * pi * ones(1, 257); d = run_trial(p, x);
    fr = p.frameLen; on = find(d.sfmts(:, 1) > 0 & abs(d.sfmts(:, 1) - d.fmts(:, 1)) > 1);
    m = false(size(d.signalOut)); for k = on', m((k-1)*fr+1:k*fr) = true; end
    out = [out, numel(on) * fr / p.sr, 20 * log10(rms(d.signalOut(m)) / rms(d0.signalOut(m)))];
  end
  [~, nm] = fileparts(q{1});
  printf('%s\t%s\t%s\t%.0f\t%.0f\t%.3f\t%+.2f\t%.3f\t%+.2f\n', q{3}, nm, q{2}, F(1), F(2), out);
end
