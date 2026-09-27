% EXP diagnostic: why does the FIRST trial after AudapterIO('init') log differently from the same token later
% in the session (exp_mixed.m S1/S2 trial 1)? Field mode as in attentionAAF run_attentionComp_audapter.m.
% Runs one token first-after-init, then after another token, then again; reports which logged fields differ,
% where, and whether the speech output differs. VARIANT=reinit calls AudapterIO('init') before every trial
% (simonSingleWord_v2 pattern), with the field stored in p as vsaSentence/uhdapter do; a field set only with
% setParam would be reset to p's zeros by init.
% Usage: ./run-oct.sh exp_mixed_diag.m
addpath('/a/other/blab-experiments/free-speech/experiment_helpers', '-end');
p = getAudapterDefaultParams('female'); p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1; p.fb = 1;
fs = 48000; randn('seed', 5); EH = [731 2058 2979 4000]; BW = [80 100 150 200];
word = @(d, f0, F) [1e-4*randn(round(0.35*fs),1); synth_vowel(fs, d, f0, F, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); 1e-4*randn(round(0.6*fs),1)];
A = word(0.30, 205, EH); B = word(0.55, 215, [300 2300 3000 4000]);
p.pertAmp = 125 * ones(1, 257); p.pertPhi = zeros(1, 257);    % stored in p, as the lab runners do before any re-init
Audapter('ost', '', 0); Audapter('pcf', '', 0); AudapterIO('init', p);
Audapter('setParam', 'pertAmp', 125 * ones(1, 257)); Audapter('setParam', 'pertPhi', zeros(1, 257));
ri = strcmp(getenv('VARIANT'), 'reinit');
a1 = exp_trial(p, A); if ri, AudapterIO('init', p); end
b1 = exp_trial(p, B); if ri, AudapterIO('init', p); end
a2 = exp_trial(p, A); if ri, AudapterIO('init', p); end
a3 = exp_trial(p, A);
fr = p.frameLen / p.sr;
for pr = {{'first-after-init vs after /i/-like token', a1, a2}, {'2nd vs 3rd occurrence', a2, a3}}
  c = pr{1}; x = c{2}.d; y = c{3}.d; printf('%s:\n', c{1});
  for f = {'fmts', 'sfmts', 'rms', 'signalOut', 'ost_stat'}
    u = x.(f{1}); v = y.(f{1}); n = min(size(u,1), size(v,1)); dd = abs(u(1:n,:) - v(1:n,:)); k = find(any(dd > 0, 2));
    if isempty(k), printf('  %-9s identical\n', f{1}); else
      if strcmp(f{1}, 'signalOut'), t = (k([1 end]) - 1) / p.sr; else, t = (k([1 end]) - 1) * fr; end
      printf('  %-9s differs in %d rows, %.3f-%.3f s, max |diff| %.4g\n', f{1}, numel(k), t, max(dd(:)));
    end
  end
end
hz2mel = @(f) 1127.01048 * log(1 + f / 700);
for c = {{'a1 (first after init)', a1}, {'b1', b1}, {'a2', a2}, {'a3', a3}}
  r = c{1}{2}; d = r.d; s = d.sfmts(:,1) > 0; ix = find(s);
  printf('%-22s shifted %.3f s | median F1 %.0f -> sF1 %.0f Hz (dF1 %+.1f mel) | median F2 %.0f -> sF2 %.0f | sF2-F2 max %.1f Hz | outF1 ratio %.3f\n', c{1}{1}, r.shift_s, ...
         median(d.fmts(ix,1)), median(d.sfmts(ix,1)), median(hz2mel(d.sfmts(ix,1)) - hz2mel(d.fmts(ix,1))), median(d.fmts(ix,2)), median(d.sfmts(ix,2)), max(abs(d.sfmts(ix,2) - d.fmts(ix,2))), r.outF1);
end
