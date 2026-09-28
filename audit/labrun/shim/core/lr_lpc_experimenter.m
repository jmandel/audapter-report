function lr_lpc_experimenter(fig)
% The virtual experimenter at free-speech check_audapterLPC (README, "Participant setup: the LPC check"). For every LPC
% order the tool offers it selects the order in the dropdown and invokes the tool's changeLPC callback (the lab code
% re-runs Audapter on the pretest trials), scores the tracks, exports the tool's two panels; then selects the chosen order,
% invokes changeLPC and saves through the OK button ("Save and exit"). Rule (fixed): cost = 0.5 A + 0.25 B + 0.25 C,
%   A  accuracy: median over trials of mean(|ln(F/Fref)|, F1 and F2) x 100, over the middle half of the vowel nucleus,
%      reference = the voice-bank token's Praat medians over that span, used only if they pass the QC in voices/bank.tsv
%      (ref_qc: two ceilings agree within 10 %, near the vowel's reference means); A needs >= 3 such trials and >= 2 words
%   B  continuity: % of frame-to-frame steps in the vowel nucleus with |dF1| > 100 Hz or |dF2| > 200 Hz
%   C  clustering: 100 x RMS distance of the tool's per-trial points to their vowel centroid / mean distance between
%      centroids (mel; vowels with >= 2 trials; if fewer than 2 vowels, C is dropped and A, B reweighted 2/3, 1/3)
% chosen = best order if (a) cost(best) <= 0.85 x cost(preset) and (b) the best order beats the preset on the per-token
% cost (2/3 a + 1/3 b with a usable reference, else b) on >= 2/3 of the pretest tokens; else the preset. Writes lpccheck/check.json (scores and data),
% lpccheck/index.json (figures only, no scores), lpccheck/order<NN>_{tracks,vowels}.png, lpccheck/audio/<trial>.wav.
global LR
UD = guidata(fig); preset = UD.nLPC; opts = get(UD.LPCdrop, 'String'); orders = cellfun(@str2double, opts);
out = fullfile(LR.outdir, 'lpccheck'); mkdir(out); mkdir(fullfile(out, 'audio'));
B = lr_voice_bank(); mel = @(f) 1127.01048 * log(1 + f / 700);
figs = ~isfield(LR.plan, 'lpcFigures') || LR.plan.lpcFigures;
S = struct('order', {}, 'A', {}, 'B', {}, 'C', {}, 'cost', {}, 'nA', {}, 'scatter', {}, 'tracks', {}, 'pc', {});
tokinfo = cell(1, numel(UD.data));   % the pretest trials as recorded (before any re-run)
for i = 1:numel(UD.data), tokinfo{i} = token_info(UD.data(i), B, i, out); end
for oi = 1:numel(orders)
  set(UD.LPCdrop, 'Value', oi); lr_invoke_callback(UD.LPCdrop); UD = guidata(fig);
  data = UD.data; expt = UD.expt; vowels = fieldnames(expt.inds.vowels);
  tracks = {}; at = NaN(1, numel(data)); bt = NaN(1, numel(data)); st = zeros(1, numel(data)); jt = zeros(1, numel(data)); wt = cell(1, numel(data));
  f1s = NaN(1, numel(data)); f2s = f1s;
  for i = 1:numel(data)
    d = data(i); sr = d.params.sr; fl = d.params.frameLen; fm = double(d.fmts(:, 1:2));
    tc = ((1:size(fm, 1))' - 0.5) * fl / sr;
    [f1s(i), f2s(i)] = tool_point(d);
    tracks{i} = struct('F1', fm(:, 1)', 'F2', fm(:, 2)');
    ti = tokinfo{i}; if isempty(ti.vowel), continue; end
    v0 = ti.vowel(1); v1 = ti.vowel(2); q0 = v0 + 0.25 * (v1 - v0); q1 = v1 - 0.25 * (v1 - v0);
    k = tc >= q0 & tc <= q1 & fm(:, 1) > 0;
    if strcmp(ti.ref_qc, 'ok') && sum(k) >= 3
      at(i) = 100 * mean(abs(log([median(fm(k, 1)) median(fm(k, 2))] ./ [ti.refF1 ti.refF2]))); wt{i} = ti.word;
    end
    kk = find(tc >= v0 & tc <= v1 & fm(:, 1) > 0);
    if numel(kk) > 1
      dd = abs(diff(fm(kk, :))); ok = diff(kk) == 1;
      st(i) = sum(ok); jt(i) = sum(ok & (dd(:, 1) > 100 | dd(:, 2) > 200)); bt(i) = 100 * jt(i) / max(st(i), 1);
    end
  end
  % C from the tool's own scatter points
  P = [mel(f1s(:)) mel(f2s(:))]; cen = []; wd = [];
  sc = struct('word', {}, 'F1', {}, 'F2', {});
  for v = 1:numel(vowels)
    idx = intersect(expt.inds.vowels.(vowels{v}), 1:numel(data)); idx = idx(~expt.bExcl(idx) & all(isfinite(P(idx, :)), 2)');
    for j = idx, sc(end+1) = struct('word', vowels{v}, 'F1', f1s(j), 'F2', f2s(j)); end
    if numel(idx) >= 2, c = mean(P(idx, :), 1); cen(end+1, :) = c; wd = [wd; sum((P(idx, :) - c).^2, 2)]; end
  end
  C = NaN;
  if size(cen, 1) >= 2
    dc = []; for a = 1:size(cen, 1), for b2 = a+1:size(cen, 1), dc(end+1) = norm(cen(a, :) - cen(b2, :)); end, end
    C = 100 * sqrt(mean(wd)) / mean(dc);
  end
  ua = isfinite(at); useA = sum(ua) >= 3 && numel(unique(wt(ua))) >= 2;
  A = NaN; if useA, A = median(at(ua)); end
  Bv = 100 * sum(jt) / max(sum(st), 1);
  if useA && isfinite(C), cost = 0.5 * A + 0.25 * Bv + 0.25 * C;
  elseif useA, cost = (2/3) * A + (1/3) * Bv;
  elseif isfinite(C), cost = 0.5 * Bv + 0.5 * C;
  else, cost = Bv; end
  pc = bt; if useA, pc(ua) = (2/3) * at(ua) + (1/3) * bt(ua); end   % per-token cost
  S(oi) = struct('order', orders(oi), 'A', A, 'B', Bv, 'C', C, 'cost', cost, 'nA', sum(ua), 'scatter', sc, 'tracks', {tracks}, 'pc', pc);
  if figs, export_panels(UD, out, orders(oi)); end
end
costs = [S.cost]; ip = find(orders == preset, 1);
[~, o] = sortrows([costs(:) abs(orders(:) - preset)]); ib = o(1);
condA = costs(ib) <= 0.85 * costs(ip);
tok = arrayfun(@(t) ~isempty(t{1}.vowel), tokinfo); wins = sum(S(ib).pc(tok) < S(ip).pc(tok)); ntok = sum(tok);
condB = wins >= (2/3) * ntok;
chosen_a = preset; if condA, chosen_a = orders(ib); end
chosen = preset; if condA && condB, chosen = orders(ib); end
% save through the tool: select the chosen order, re-run, OK -> "Save and exit"
set(UD.LPCdrop, 'Value', find(orders == chosen, 1)); lr_invoke_callback(UD.LPCdrop);
R = struct('talker', LR.plan.voice, 'gender', LR.plan.gender, 'study', LR.plan.name, 'preset', preset, 'chosen', chosen, ...
  'chosen_no_margin', orders(ib), 'chosen_margin_only', chosen_a, 'differs', chosen ~= preset, 'best_wins_tokens', wins, 'n_tokens', ntok, ...
  'margin_rule', 'best order if cost <= 0.85 x cost(preset) and it beats the preset on the per-token cost on >= 2/3 of tokens, else preset', ...
  'weights', struct('A', 0.5, 'B', 0.25, 'C', 0.25), 'orders', rmfield(S, {'scatter', 'tracks', 'pc'}), 'per_token_cost', {arrayfun(@(s) s.pc, S, 'UniformOutput', false)}, 'scatter', {arrayfun(@(s) s.scatter, S, 'UniformOutput', false)}, ...
  'tokens', {tokinfo}, 'audapter_tracks', {arrayfun(@(s) s.tracks, S, 'UniformOutput', false)});
fid = fopen(fullfile(out, 'check.json'), 'w'); fprintf(fid, '%s', jsonencode(R)); fclose(fid);
I = struct('talker', LR.plan.voice, 'study', LR.plan.name, 'preset', preset, 'orders', orders, 'figures', ...
  {arrayfun(@(n) struct('order', n, 'tracks', sprintf('order%02d_tracks.png', n), 'vowels', sprintf('order%02d_vowels.png', n)), orders, 'UniformOutput', false)});
fid = fopen(fullfile(out, 'index.json'), 'w'); fprintf(fid, '%s', jsonencode(I)); fclose(fid);
lr_log_op(struct('op', 'lpc-check', 'preset', preset, 'chosen', chosen, 'best', orders(ib), 'margin_only', chosen_a, 'wins', sprintf('%d/%d', wins, ntok), 'costs', mat2str(costs, 4)));
b = []; u = findall(fig, 'type', 'uicontrol');
for i = 1:numel(u), if strcmpi(get(u(i), 'Style'), 'pushbutton') && strcmp(get(u(i), 'String'), 'OK'), b = u(i); break; end, end
if ~isempty(b), lr_invoke_callback(b); else, lr_note('lpc check: OK button not found'); end
end

function [f1, f2] = tool_point(d)
% the tool's per-trial point (check_audapterLPC updatePlots): OST vowel frames (offset-corrected), middle 50 %, median
f1 = NaN; f2 = NaN;
if isfield(d, 'calcOST') && ~isempty(d.calcOST), vf = find(d.calcOST == 2 | d.calcOST == 3);
elseif isfield(d, 'ost_calc') && ~isempty(d.ost_calc), vf = find(d.ost_calc == 2 | d.ost_calc == 3);
else, vf = find(d.ost_stat == 2 | d.ost_stat == 3); end
fm = double(d.fmts);
if ~isempty(vf)
  fd = 1 / d.params.sr * d.params.frameLen; off = [floor(0.05 / fd) floor(0.01 / fd)];
  vf = max(1, vf(1) - off(1)):min(size(fm, 1), vf(end) - off(2)); x = fm(vf, 1:2);
  f1 = median(mid50(x(:, 1)), 'omitnan'); f2 = median(mid50(x(:, 2)), 'omitnan');
else
  k = find(fm(:, 1) > 0); if numel(k) > 4, a = round(numel(k) / 4); b = round(numel(k) / 2); f1 = mean(fm(k(a:b), 1)); f2 = mean(fm(k(a:b), 2)); end
end
end
function y = mid50(x)
n = numel(x); a = floor(n / 4) + 1; b = n - floor(n / 4); y = x(a:max(a, b));
end

function ti = token_info(d, B, i, out)
% which voice-bank token this pretest trial carried (matched on the recorded input), its vowel nucleus and Praat track
% in trial time, and the pretest signalIn as audio
global LR
si = double(d.signalIn(:)); fp = [numel(si), sum(abs(si)), sum(si.^2)];
ti = struct('trial', i, 'id', '', 'word', '', 'sr', d.params.sr, 'frameLen', d.params.frameLen, 't0', 0.5 * d.params.frameLen / d.params.sr, ...
  'vowel', [], 'refF1', NaN, 'refF2', NaN, 'ref_qc', '', 'praat', struct('t', [], 'F1', [], 'F2', []));
audiowrite(fullfile(out, 'audio', sprintf('%03d.wav', i)), max(-1, min(1, si)), d.params.sr);
m = [];
for j = numel(LR.sigLog):-1:1
  g = LR.sigLog(j).fp; if g(1) == fp(1) && abs(g(2) - fp(2)) <= 1e-4 * max(fp(2), 1e-9) && abs(g(3) - fp(3)) <= 1e-4 * max(fp(3), 1e-12), m = j; break; end
end
if isempty(m), return; end
desc = LR.sigLog(m).desc;
tk = regexp(desc, 'tok=(\S+)', 'tokens', 'once'); w = regexp(desc, '"([^"]*)"', 'tokens', 'once');
on = regexp(desc, 'onset=([0-9.]+)', 'tokens', 'once'); vv = regexp(desc, 'vowel=([0-9.]+)-([0-9.]+)', 'tokens', 'once');
if isempty(tk) || isempty(vv), return; end
ti.id = tk{1}; ti.word = w{1}; ti.vowel = [str2double(vv{1}) str2double(vv{2})];
t = find(strcmp(B.tok, tk{1}), 1); if isempty(t), return; end
ti.refF1 = B.refF1(t); ti.refF2 = B.refF2(t); ti.ref_qc = B.refQC{t};
f = strrep(regexprep(B.path{t}, '\.wav$', '.tsv'), [filesep 'tok' filesep], [filesep 'tracks' filesep]);
if ~exist(f, 'file'), return; end
L = strsplit(strtrim(fileread(f)), "\n"); M = NaN(numel(L) - 1, 4);
for j = 2:numel(L), c = strsplit(L{j}, "\t"); M(j - 1, :) = [str2double(c{1}) str2double(c{4}) str2double(c{5}) str2double(c{3})]; end
tsig = M(:, 1) - B.rawOnset(t) + str2double(on{1});        % raw take time -> trial time
ti.praat = struct('t', tsig', 'F1', M(:, 2)', 'F2', M(:, 3)');
end

function export_panels(UD, out, n)
% the tool's two panels, re-drawn from its own axes into separate figures with fixed limits across orders (labrun never
% renders figures: its __gnuplot_drawnow__ stand-in is taken off the path while printing)
P = path; dn = fileparts(which('__gnuplot_drawnow__')); if ~isempty(strfind(dn, 'shim')), rmpath(dn); end
try
  f2 = figure('Visible', 'off', 'Position', [0 0 700 600]); a = copyobj(UD.F1F2ax, f2);
  set(a, 'Units', 'normalized', 'Position', [0.12 0.1 0.83 0.82], 'XLim', [150 1300], 'YLim', [500 3200]);
  title(a, sprintf('LPC order %d: F1-F2 of every pretest trial', n)); xlabel(a, 'F1 (Hz)'); ylabel(a, 'F2 (Hz)');
  fn = fullfile(out, sprintf('order%02d_vowels.png', n)); print(f2, fn, '-dpngcairo'); close(f2);
  f3 = figure('Visible', 'off', 'Position', [0 0 1100 700]); nv = numel(UD.hsubTracks); nr = ceil(nv / 2);
  for v = 1:nv
    a = copyobj(UD.hsubTracks(v), f3); set(a, 'Units', 'normalized', 'Position', [0.07 + 0.47 * mod(v - 1, 2), 1 - (ceil(v / 2)) / nr + 0.08, 0.4, 1 / nr - 0.14], 'YLim', [0 4000]);
    vw = fieldnames(UD.expt.inds.vowels); title(a, vw{v}); xlabel(a, 'time (s)'); ylabel(a, 'Hz');
  end
  annotation(f3, 'textbox', [0 0.95 1 0.05], 'String', sprintf('LPC order %d: formant tracks (F1, F2) over the spectrogram, one token per vowel', n), 'LineStyle', 'none');
  print(f3, fullfile(out, sprintf('order%02d_tracks.png', n)), '-dpngcairo'); close(f3);
catch e
  lr_note(sprintf('lpc check: figure export failed at order %d: %s', n, e.message)); printf('labrun: lpc check: export failed: %s\n', e.message);
end
path(P);
end
