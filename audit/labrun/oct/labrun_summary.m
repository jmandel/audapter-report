function labrun_summary(outdir, opts)
% Per-trial summary of a labrun output directory (trials/NNNN.mat written by the device shim):
%   summary.tsv   one row per device trial
%   summary.md    run status, speed, prompts, notes, parameter intent diffs, OST/PCF files, per-condition table
%   ost/          every distinct OST/PCF text the lab code loaded (named by hash; first trial noted)
%   audio/        stereo WAVs (L = mic input as Audapter logged it, R = what the participant hears:
%                 signalOut x dScale) for a sample of trials (opts.wavs: 'sample' (default) | 'all' | 'none')
% Measures (independent of Audapter's own tracker unless noted):
%   ost      OST state timeline from ost_stat: "state@s" at every change
%   shift    frames where Audapter logged sfmts ~= fmts (Audapter's own log): total s, first-last s,
%            median logged shift F1/F2 (Hz and mel)
%   heard    independent LPC (harness est_formants) on signalIn vs signalOut (aligned by the measured lag),
%            median F1/F2 over voiced frames, and over the logged shift span only
%   pitch    independent autocorrelation F0 (harness est_f0) in vs out, cents
%   level    out/in RMS over voiced samples (dB), heard = signalOut x dScale; peak of heard signal
%   lag      in->out lag by cross-correlation (ms), within Audapter (device buffering not included)
%   noise    zero runs >= 5 ms in signalOut while fb is 2..5 (the I-01 playback-buffer gap), count and times
%   limits   pumped audio vs the returned recording (Audapter's recorder holds 480000 samples at sr)
if nargin < 2, opts = struct(); end
if ~isfield(opts, 'wavs'), opts.wavs = 'sample'; end
if ~isfield(opts, 'wavPerCond'), opts.wavPerCond = 2; end
if ~exist(fullfile(outdir, 'trials'), 'dir'), return; end
F = dir(fullfile(outdir, 'trials', '*.mat')); F = F(cellfun(@isempty, regexp({F.name}, '_ptbCapture', 'once')));
if isempty(F), printf('labrun_summary: no trials\n'); end
hz2mel = @(f) 1127.01048 * log(1 + f / 700);
rows = {}; ostSeen = struct('hash', {}, 'kind', {}, 'file', {}, 'first', {}, 'n', {});
diffs = struct('kind', {}, 'field', {}, 'param', {}, 'intended', {}, 'actual', {}, 'trials', {});
wavCount = struct();
if ~exist(fullfile(outdir, 'audio'), 'dir') && ~strcmp(opts.wavs, 'none'), mkdir(fullfile(outdir, 'audio')); end
if ~exist(fullfile(outdir, 'ost'), 'dir'), mkdir(fullfile(outdir, 'ost')); end
for i = 1:numel(F)
  S = load(fullfile(outdir, 'trials', F(i).name)); r = S.rec;
  if ~isfield(r, 'ops'), r.ops = {}; end
  % --- OST/PCF texts from the op stream ---
  for j = 1:numel(r.ops)
    o = r.ops{j};
    if any(strcmp(o.op, {'ost', 'pcf'})) && isfield(o, 'text') && ~isempty(o.text)
      h = hash('md5', o.text); h = h(1:10); m = find(strcmp({ostSeen.hash}, h), 1);
      if isempty(m)
        [~, nm, e] = fileparts(regexprep(o.file, '.*[\\/]', '')); fn = sprintf('%s_%s%s', h, nm, e);
        fid = fopen(fullfile(outdir, 'ost', fn), 'w'); fwrite(fid, o.text); fclose(fid);
        ostSeen(end+1) = struct('hash', h, 'kind', o.op, 'file', [nm e], 'first', r.k, 'n', 1);
      else
        ostSeen(m).n = ostSeen(m).n + 1;
      end
    end
  end
  % --- parameter intent diffs ---
  if ~isfield(r, 'intentDiff'), r.intentDiff = {}; end
  if ~isfield(r, 'ops'), r.ops = {}; end
  for j = 1:numel(r.intentDiff)
    d = r.intentDiff{j}; key = [d.kind '|' d.field '|' lr_s(d.intended) '|' lr_s(d.actual)];
    m = find(arrayfun(@(x) strcmp([x.kind '|' x.field '|' lr_s(x.intended) '|' lr_s(x.actual)], key), diffs), 1);
    if isempty(m), d.trials = r.k; diffs(end+1) = d; else, diffs(m).trials(end+1) = r.k; end
  end
  fbv = NaN; if isfield(r, 'fb'), fbv = r.fb; end
  row = struct('k', r.k, 'mode', r.mode, 'itrial', r.ctx.itrial, 'word', r.ctx.word, 'cond', r.ctx.cond, 'shiftInfo', r.ctx.shift, ...
    't0', r.t0, 'dur', r.t1 - r.t0, 'pumped_s', r.pumped_s, 'sr', r.sr, 'fb', fbv, 'input', r.inputDesc);
  if strcmp(r.mode, 'proc') && isfield(r, 'dataMat') && numel(r.dataMat) > 1
    row = lr_trial_measures(r, row, hz2mel);
    % sample WAVs
    key = regexprep([r.ctx.cond '_' r.mode], '\W', '_'); if ~isfield(wavCount, key), wavCount.(key) = 0; end
    if strcmp(opts.wavs, 'all') || (strcmp(opts.wavs, 'sample') && wavCount.(key) < opts.wavPerCond)
      wavCount.(key) = wavCount.(key) + 1;
      sc = lr_num(r.params, 'scale', 1);
      w = [double(r.signalIn) double(r.signalOut) * sc]; w = max(-1, min(1, w));
      audiowrite(fullfile(outdir, 'audio', sprintf('%04d_%s.wav', r.k, regexprep([r.ctx.word '_' r.ctx.cond], '\W', ''))), w, r.sr);
    end
  elseif strcmp(r.mode, 'ptbCapture')
    x = double(r.captured); row.read_s = r.read_s; row.lost_s = r.lost_s;
    W = round(0.02 * r.sr); env = sqrt(filter(ones(W, 1) / W, 1, x.^2)); act = env > max([env; 1e-9]) * 0.1;
    row.in_rms_dB = 20 * log10(max(sqrt(mean(x(act).^2)), 1e-12));
    if ~strcmp(opts.wavs, 'none'), audiowrite(fullfile(outdir, 'audio', sprintf('%04d_ptbCapture.wav', r.k)), max(-1, min(1, x)), r.sr); end
  elseif isfield(r, 'play')
    row.play_s = numel(r.play) / r.fsDev; row.play_peak = r.playPeak;
    row.play_rms_dB = 20 * log10(max(sqrt(mean(double(r.play).^2)), 1e-12));
    if ~strcmp(opts.wavs, 'none') && ~isempty(r.play)
      audiowrite(fullfile(outdir, 'audio', sprintf('%04d_%s.wav', r.k, r.mode)), max(-1, min(1, double(r.play))), r.fsDev);
    end
  end
  rows{end+1} = row;
end
% --- summary.tsv ---
cols = {'k', 'mode', 'itrial', 'word', 'cond', 'shiftInfo', 't0', 'dur', 'pumped_s', 'rec_s', 'rec_limit_s', 'sr', 'fb', ...
  'ost', 'shift_s', 'shift_span', 'shift_F1_Hz', 'shift_F2_Hz', 'shift_F1_mel', 'shift_F2_mel', ...
  'in_F1', 'in_F2', 'out_F1', 'out_F2', 'span_in_F1', 'span_in_F2', 'span_out_F1', 'span_out_F2', ...
  'in_f0', 'out_f0', 'pitch_cents', 'gain_dB', 'heard_peak', 'lag_ms', 'in_rms_dB', 'noise_zero_runs', 'noise_zero_at', ...
  'play_s', 'play_rms_dB', 'play_peak', 'read_s', 'lost_s', 'input'};
fid = fopen(fullfile(outdir, 'summary.tsv'), 'w'); fprintf(fid, '%s\n', strjoin(cols, "\t"));
for i = 1:numel(rows)
  c = cell(1, numel(cols));
  for j = 1:numel(cols), if isfield(rows{i}, cols{j}), c{j} = lr_s(rows{i}.(cols{j})); else, c{j} = ''; end, end
  fprintf(fid, '%s\n', strjoin(c, "\t"));
end
fclose(fid);
% --- summary.md ---
R = struct(); if exist(fullfile(outdir, 'run.json'), 'file'), R = jsondecode(fileread(fullfile(outdir, 'run.json'))); end
fid = fopen(fullfile(outdir, 'summary.md'), 'w');
fprintf(fid, '# labrun: %s\n\n', lr_f(R, 'name', '?'));
fprintf(fid, '- status: **%s** %s\n', lr_f(R, 'status', '?'), lr_f(R, 'error', ''));
if isfield(R, 'errstack') && ~isempty(R.errstack), fprintf(fid, '  - at %s\n', R.errstack{1:min(3, end)}); end
fprintf(fid, '- device trials: %d (audio %d); virtual time %.1f s (audio %.1f s); wall %.1f s; speed %.1fx virtual, %.1fx audio\n', ...
  lr_f(R, 'ntrials_started', 0), lr_f(R, 'ntrials_proc', 0), lr_f(R, 'virtual_s', 0), lr_f(R, 'audio_s', 0), lr_f(R, 'wall_s', 0), lr_f(R, 'speed_virtual_per_wall', 0), lr_f(R, 'speed_audio_per_wall', 0));
if isfield(R, 'prompts') && ~isempty(R.prompts)
  fprintf(fid, '- console/dialog prompts answered (see ops.tsv for answers):\n');
  P = R.prompts; if ischar(P), P = {P}; end
  for j = 1:numel(P), fprintf(fid, '  - `%s`\n', strtrim(P{j})); end
end
if exist(fullfile(outdir, 'transforms.tsv'), 'file')
  T = strsplit(strtrim(fileread(fullfile(outdir, 'transforms.tsv'))), "\n");
  if numel(T) > 1, fprintf(fid, '- load-time transformations: %d lines (transforms.tsv)\n', numel(T) - 1); end
end
N = {}; if isfield(R, 'notes'), N = R.notes; if ischar(N), N = {N}; end, end
if ~isempty(N)
  [u, ~, ix] = unique(regexprep(N, '^\[t=[0-9.]+ trial \d+\] ', ''));
  fprintf(fid, '- notes:\n'); for j = 1:numel(u), fprintf(fid, '  - %s (x%d)\n', u{j}, sum(ix == j)); end
end
fprintf(fid, '\n## OST/PCF files loaded\n\n| file | kind | hash | first trial | loads |\n|---|---|---|---|---|\n');
for j = 1:numel(ostSeen), fprintf(fid, '| %s | %s | %s | %d | %d |\n', ostSeen(j).file, ostSeen(j).kind, ostSeen(j).hash, ostSeen(j).first, ostSeen(j).n); end
fprintf(fid, '\n## Intended parameters vs what Audapter reports\n\n');
fprintf(fid, 'The script''s parameter struct at each `start` (p / params / expt.audapterParams) against `getParam`.\n');
fprintf(fid, '`mismatch`: the struct holds a value Audapter does not have. `not-forwarded`: Audapter has the parameter but AudapterIO(''init'') never sends that field and the script never set it. `unknown`: no Audapter parameter of that name.\n\n');
[~, o] = sort({diffs.kind}); diffs = diffs(o);
nd = sum(strcmp({diffs.kind}, 'unknown-default'));
if nd, fprintf(fid, '(%d fields of getAudapterDefaultParams that are not Audapter parameters are omitted: kind unknown-default.)\n\n', nd); end
diffs = diffs(~strcmp({diffs.kind}, 'unknown-default'));
fprintf(fid, '| kind | field | param | intended | actual | trials |\n|---|---|---|---|---|---|\n');
for j = 1:numel(diffs)
  d = diffs(j); fprintf(fid, '| %s | %s | %s | %s | %s | %s |\n', d.kind, d.field, d.param, lr_s(d.intended), lr_s(d.actual), lr_trials(d.trials));
end
% per-condition aggregates
fprintf(fid, '\n## Per condition (audio trials)\n\n| cond | n | dur s | shift s (mean) | logged F1/F2 shift Hz | heard/spoken F1 | heard/spoken F2 | span heard/spoken F1 | span heard/spoken F2 | pitch cents | gain dB | lag ms | noise zero runs |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n');
proc = rows(cellfun(@(x) strcmp(x.mode, 'proc'), rows));
conds = unique(cellfun(@(x) x.cond, proc, 'UniformOutput', false), 'stable');
for c = 1:numel(conds)
  P = proc(cellfun(@(x) strcmp(x.cond, conds{c}), proc));
  g = @(f) cellfun(@(x) lr_numf(x, f), P);
  fprintf(fid, '| %s | %d | %.2f | %.3f | %s / %s | %.3f | %.3f | %.3f | %.3f | %.0f | %.2f | %.1f | %d |\n', lr_or(conds{c}, '(none)'), numel(P), ...
    lr_nm(g('dur')), lr_nm(g('shift_s')), lr_s(round(lr_nm(g('shift_F1_Hz')))), lr_s(round(lr_nm(g('shift_F2_Hz')))), ...
    lr_nm(g('out_F1') ./ g('in_F1')), lr_nm(g('out_F2') ./ g('in_F2')), lr_nm(g('span_out_F1') ./ g('span_in_F1')), lr_nm(g('span_out_F2') ./ g('span_in_F2')), ...
    lr_nm(g('pitch_cents')), lr_nm(g('gain_dB')), lr_nm(g('lag_ms')), lr_nsum(g('noise_zero_runs')));
end
fprintf(fid, '\nPer-trial rows: summary.tsv. Command log: ops.tsv. Timeline: timeline.tsv. Played sounds: plays.tsv.\n');
fclose(fid);
printf('labrun_summary: %d trials -> %s\n', numel(rows), fullfile(outdir, 'summary.md'));
end

function row = lr_trial_measures(r, row, hz2mel)
sr = r.sr; fl = r.frameLen; D = double(r.dataMat); nT = r.nTracks; nL = r.nLPC;
o = 5; fm = D(:, o:o+nT-1); o2 = o + 2*nT + 2; sf = D(:, o2:o2+1);
o3 = o + 2*nT + 4 + nL + 1; ost = D(:, o3 + 1);
tf = ((1:size(D, 1))' ) * fl / sr;               % frame end times (s)
ch = [1; find(diff(ost) ~= 0) + 1];
row.ost = strjoin(arrayfun(@(j) sprintf('%d@%.3f', ost(j), tf(j)), ch(:)', 'UniformOutput', false), ' ');
if numel(ch) > 40, row.ost = [strjoin(arrayfun(@(j) sprintf('%d@%.3f', ost(j), tf(j)), ch(1:40)', 'UniformOutput', false), ' ') ' ...']; end
sh = sf(:, 1) > 0 & fm(:, 1) > 0 & (abs(sf(:, 1) - fm(:, 1)) > 0.5 | abs(sf(:, 2) - fm(:, 2)) > 0.5);
row.shift_s = sum(sh) * fl / sr;
if any(sh)
  row.shift_span = sprintf('%.3f-%.3f', tf(find(sh, 1)) - fl/sr, tf(find(sh, 1, 'last')));
  row.shift_F1_Hz = median(sf(sh, 1) - fm(sh, 1)); row.shift_F2_Hz = median(sf(sh, 2) - fm(sh, 2));
  row.shift_F1_mel = median(hz2mel(sf(sh, 1)) - hz2mel(fm(sh, 1))); row.shift_F2_mel = median(hz2mel(sf(sh, 2)) - hz2mel(fm(sh, 2)));
else
  row.shift_span = ''; row.shift_F1_Hz = 0; row.shift_F2_Hz = 0; row.shift_F1_mel = 0; row.shift_F2_mel = 0;
end
x = double(r.signalIn); sc = lr_num(r.params, 'scale', 1); y = double(r.signalOut) * sc;
row.rec_s = numel(x) / sr; row.rec_limit_s = r.maxRecSize / sr;
% lag in -> out
L = round(0.06 * sr); lag = 0;
if any(x) && any(y)
  [c, lg] = xcorr(y, x, L); [~, m] = max(abs(c)); lag = lg(m);
end
row.lag_ms = lag / sr * 1000;
ya = y; if lag > 0, ya = [y(lag+1:end); zeros(lag, 1)]; elseif lag < 0, ya = [zeros(-lag, 1); y(1:end+lag)]; end
% voiced samples: input envelope within 20 dB of its peak
W = round(0.02 * sr); env = sqrt(filter(ones(W, 1) / W, 1, x.^2)); act = env > max(env) * 0.1;
row.in_rms_dB = 20 * log10(max(sqrt(mean(x(act).^2)), 1e-12));
if any(act)
  row.gain_dB = 20 * log10(sqrt(mean(ya(act).^2)) / max(sqrt(mean(x(act).^2)), 1e-12));
else, row.gain_dB = NaN; end
row.heard_peak = max(abs(y));
% formants (independent LPC at 16 kHz)
fsA = 16000; if sr ~= fsA, xa = resample(x, fsA, sr); yb = resample(ya, fsA, sr); else, xa = x; yb = ya; end
thr = max(env) * 0.1;
try
  [Fi, ti] = est_formants(xa, fsA, 'rmsmin', thr); [Fo, to] = est_formants(yb, fsA, 'rmsmin', thr * 10^(row.gain_dB/20));
  n = min(size(Fi, 1), size(Fo, 1)); Fi = Fi(1:n, :); Fo = Fo(1:n, :); ti = ti(1:n);
  ok = all(isfinite([Fi Fo]), 2);
  row.in_F1 = median(Fi(ok, 1)); row.in_F2 = median(Fi(ok, 2)); row.out_F1 = median(Fo(ok, 1)); row.out_F2 = median(Fo(ok, 2));
  if any(sh)
    t1 = tf(find(sh, 1)) - fl/sr; t2 = tf(find(sh, 1, 'last'));
    sp = ok & ti >= t1 & ti <= t2;
    if any(sp), row.span_in_F1 = median(Fi(sp, 1)); row.span_in_F2 = median(Fi(sp, 2)); row.span_out_F1 = median(Fo(sp, 1)); row.span_out_F2 = median(Fo(sp, 2)); end
  end
catch
end
try
  f0i = est_f0(xa, fsA); f0o = est_f0(yb, fsA); row.in_f0 = f0i; row.out_f0 = f0o; row.pitch_cents = 1200 * log2(f0o / f0i);
catch
end
% I-01: holes in the playback noise while a constant-noise mode (fb 2 or 3) is on: runs >= 5 ms where the output's 1-ms RMS
% falls below 10 % of its median level in the input's quiet stretches (fb 2 plays noise only, so the hole is exact
% zeros; with fb 3 the microphone floor still passes through)
row.noise_zero_runs = 0; row.noise_zero_at = '';
if r.fb == 2 || r.fb == 3   % (fb 4/5 noise follows the voice, so it is silent in pauses anyway)
  o = double(r.signalOut); m1 = max(1, round(0.001 * sr));
  e = sqrt(filter(ones(m1, 1) / m1, 1, o.^2)); ei = sqrt(filter(ones(m1, 1) / m1, 1, x.^2));
  quiet = ei < max(ei) * 0.01; quiet(1:min(end, 3 * fl)) = false;
  if any(quiet)
    base = median(e(quiet)); z = quiet & e < 0.1 * base;
    d = diff([0; z; 0]); s0 = find(d == 1); s1 = find(d == -1) - 1; len = s1 - s0 + 1;
    big = len >= round(0.005 * sr);
    row.noise_zero_runs = sum(big);
    row.noise_zero_at = strjoin(arrayfun(@(a, b) sprintf('%.3f+%.1fms', a / sr, b / sr * 1000), s0(big), len(big), 'UniformOutput', false), ' ');
  end
end
end

function v = lr_num(P, name, d)
v = d; if isfield(P, name), s = P.(name); if isnumeric(s), v = s; else, t = str2double(s); if isfinite(t), v = t; end, end, end
end
function v = lr_numf(x, f)
v = NaN; if isfield(x, f) && isnumeric(x.(f)) && isscalar(x.(f)), v = x.(f); end
end
function m = lr_nm(v)
v = v(isfinite(v)); if isempty(v), m = NaN; else, m = mean(v); end
end
function s = lr_s(v)
if ischar(v), s = strrep(strrep(v, "\t", ' '), "\n", ' '); elseif isnumeric(v) || islogical(v)
  if isempty(v), s = ''; elseif isscalar(v), s = num2str(v, 6); else, s = mat2str(v, 6); end
else, s = class(v); end
end
function v = lr_f(R, f, d)
if isfield(R, f), v = R.(f); else, v = d; end
if iscell(v) && isempty(v), v = ''; end
end
function s = lr_or(a, b)
if isempty(a), s = b; else, s = a; end
end
function s = lr_trials(t)
t = unique(t); if numel(t) <= 6, s = strjoin(arrayfun(@num2str, t, 'UniformOutput', false), ','); else, s = sprintf('%d trials (%d-%d)', numel(t), t(1), t(end)); end
end
function s = lr_nsum(v)
s = sum(v(isfinite(v)));
end
