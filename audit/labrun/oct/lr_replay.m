function [yv, chk] = lr_replay(r)
% Voice-only replay of a recorded proc trial, for measurement only (never used as the heard signal).
% In fb 2..5 Audapter's signalOut is voice + masking noise. Audapter is deterministic, so rerunning the trial's exact
% microphone input with the trial's own parameters (rec.paramsFull: the getParam snapshot at start), OST/PCF texts and
% fb = 1 (nothing else changed) in a freshly loaded MEX gives the shifted voice alone. Every replay is checked; yv is
% returned only if all checks pass:
%   input      replay signalIn == recorded signalIn (max |diff| <= 1e-6)
%   formants   replay fmts and sfmts == recorded (max |diff| < 0.01 Hz)
%   residual   recorded signalOut - replay over the voiced part (replay envelope within 20 dB of its max) is noise only:
%              leakage beta = <residual, replay>/<replay, replay> with |beta| < 0.03 (about +-0.25 dB of voice gain) and
%              residual RMS <= recorded signalOut RMS before voice onset + 2 dB (|corr| is logged; it is not a criterion:
%              babble correlates with the voice by chance, and correlation scales with the voice-to-noise ratio)
% Runs in the summary stage, after the session, so it cannot change any recorded trial.
chk = struct('pass', false, 'reason', '', 'in_maxdiff', NaN, 'fmts_maxdiff', NaN, 'sfmts_maxdiff', NaN, ...
  'resid_corr', NaN, 'resid_beta', NaN, 'resid_dB_re_pre', NaN);
yv = [];
if ~isfield(r, 'paramsFull') || ~isfield(r, 'ostText') || ~isfield(r, 'pcfText'), chk.reason = 'record lacks full parameters or OST/PCF text'; return; end
N = r.frameLen * r.downFact; x = double(r.input(:));
if numel(x) < r.nframes * N, chk.reason = 'pumped input not fully recorded'; return; end
clear AudapterReal;                                 % fresh MEX state
P = r.paramsFull; f = fieldnames(P);
first = {'srate', 'downfact', 'framelen', 'ndelay'};
order = [first(ismember(first, f)), setdiff(f, [first, {'fb', 'datapb'}])'];
for j = 1:numel(order)
  v = P.(order{j}); if isempty(v) || ~isnumeric(v), continue; end
  try, AudapterReal('setParam', order{j}, double(v), 0); catch, end
end
AudapterReal('setParam', 'fb', 1, 0);
tp = tempname();
if isempty(r.ostText), AudapterReal('ost', '', 0); else, fid = fopen([tp '.ost'], 'w'); fwrite(fid, r.ostText); fclose(fid); AudapterReal('ost', [tp '.ost'], 0); end
if isempty(r.pcfText), AudapterReal('pcf', '', 0); else, fid = fopen([tp '.pcf'], 'w'); fwrite(fid, r.pcfText); fclose(fid); AudapterReal('pcf', [tp '.pcf'], 0); end
AudapterReal('reset');
for k = 1:r.nframes
  fr = x((k-1)*N+1:k*N) + 0; AudapterReal('runFrame', fr);
end
[sig, dat] = AudapterReal(4);
delete([tp '.*']); clear AudapterReal;
si = double(sig(:, 1)); so = double(sig(:, min(2, end)));
D0 = double(r.dataMat); D1 = double(dat); nT = r.nTracks;
n = min(numel(si), numel(r.signalIn)); chk.in_maxdiff = max([0; abs(si(1:n) - double(r.signalIn(1:n)))]);
m = min(size(D0, 1), size(D1, 1)); o2 = 5 + 2*nT + 2;
if m == 0 || size(D0, 1) ~= size(D1, 1), chk.reason = sprintf('frame count %d vs %d', size(D1, 1), size(D0, 1)); return; end
chk.fmts_maxdiff = max(max(abs(D1(:, 5:6) - D0(:, 5:6)))); chk.sfmts_maxdiff = max(max(abs(D1(:, o2:o2+1) - D0(:, o2:o2+1))));
y0 = double(r.signalOut); n = min(numel(so), numel(y0)); so = so(1:n); y0 = y0(1:n);
W = round(0.02 * r.sr); e = sqrt(filter(ones(W, 1) / W, 1, so.^2)); act = e > max([e; 1e-12]) * 0.1;
res = y0 - so; i1 = find(act, 1); pre = max(1, round(0.05 * r.sr)):max(1, i1 - W);
if any(act)
  a = res(act); b = so(act); chk.resid_corr = sum(a .* b) / sqrt(sum(a.^2) * sum(b.^2) + 1e-30);
  chk.resid_beta = sum(a .* b) / (sum(b.^2) + 1e-30);   % voice left in the residual (a 1 dB gain error gives 0.12)
  if numel(pre) > W, chk.resid_dB_re_pre = 20 * log10(sqrt(mean(a.^2)) / max(sqrt(mean(y0(pre).^2)), 1e-12)); end
end
why = {};
if chk.in_maxdiff > 1e-6, why{end+1} = sprintf('input differs (%.3g)', chk.in_maxdiff); end
if ~(chk.fmts_maxdiff < 0.01), why{end+1} = sprintf('fmts differ (%.3g Hz)', chk.fmts_maxdiff); end
if ~(chk.sfmts_maxdiff < 0.01), why{end+1} = sprintf('sfmts differ (%.3g Hz)', chk.sfmts_maxdiff); end
if ~(abs(chk.resid_beta) < 0.03), why{end+1} = sprintf('voice left in the residual (beta %.3f)', chk.resid_beta); end
if ~(chk.resid_dB_re_pre <= 2), why{end+1} = sprintf('residual %.1f dB above the pre-onset output', chk.resid_dB_re_pre); end
chk.reason = strjoin(why, '; ');
if isempty(why), chk.pass = true; yv = single(so); end
end
