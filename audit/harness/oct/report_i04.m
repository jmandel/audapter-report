% Report asset export for I-04 (runFrame writes its output into the caller's input array; mexLibrary.cpp:364 -> Audapter.cpp:77).
% Offline reprocessing the way the blab demos do it (test_audapter.m, audapterDemo_triphthong.m): sigInCell = makecell(sigIn, N),
% then Audapter('runFrame', sigInCell{n}) for every frame. Two conditions from ONE stored recording:
%   condition 1: F1 +20 % (1D field covering all formants), condition 2: F1 -20 %.
% "reused": the same sigInCell for both conditions (what a parameter sweep over one cell array does);
% "fresh":  a new makecell per condition (the correct result). Octave; see the card for the MATLAB caveat.
% Usage: ./run-oct.sh report_i04.m      Output: out/report/i-04/blab/{*.wav,data.json}
1;
function C = mkcell(x, N)   % makecell.m with MATLAB semantics: every cell holds its own copy (Octave may share contiguous slices)
  C = cell(1, floor(numel(x) / N));
  for n = 1:numel(C), C{n} = x((n - 1) * N + 1 : n * N) + 0; end
end
function d = runcell(q, C)
  AudapterIO('init', q); Audapter('reset');
  for n = 1:numel(C), Audapter('runFrame', C{n}); end      % no copy, as in test_audapter.m:103-105
  d = AudapterIO('getData');
end
p = defparams('female'); fs = p.sr * p.downFact; N = p.frameLen * p.downFact; fr = p.frameLen / p.sr;
q1 = p; q1.bShift = 1; q1.bRatioShift = 1; q1.bMelShift = 0; q1.F1Min = 0; q1.F1Max = 5000; q1.F2Min = 0; q1.F2Max = 5000; q1.LBk = 0; q1.LBb = 0;
q1.pertF2 = linspace(0, 5000, 257); q1.pertAmp = 0.2 * ones(1, 257); q1.pertPhi = zeros(1, 257);
q2 = q1; q2.pertPhi = pi * ones(1, 257);                                   % ratio shift along -F1: F1 x 0.8
x = synth_vowel(fs, 1.0, 120, [760 1150 2500 3500], [80 100 150 200], 'onset', 0.1, 'offset', 0.2, 'amp', 0.3);
C = mkcell(x, N); x0 = cell2mat(C(:));                                    % the stored recording as a cell array of frames
dA1 = runcell(q1, C);                                                     % condition 1
chg = max(abs(cell2mat(C(:)) - x0));
dA2 = runcell(q2, C);                                                     % condition 2, SAME cell array (now holds condition 1's output)
dB1 = runcell(q1, mkcell(x, N));                                        % correct: fresh cells per condition
dB2 = runcell(q2, mkcell(x, N));
% Octave-only side note: makecell.m's slices can share storage with x itself, so runFrame on them also rewrites x
xo = x + 0; Co = makecell(xo, N); xo_keep = xo + 0; runcell(q1, Co); r_octave_slice_alias = max(abs(xo - xo_keep));
hf = @(y) median(est_formants(y(round(0.35*p.sr):round(0.85*p.sr)), p.sr)(:,1), 'omitnan');
r = struct('frame_s', fr, 'N', N);
r.cell_max_change = chg; r.octave_makecell_rewrites_x = r_octave_slice_alias;
r.F1_in_hz = hf(dB1.signalIn); r.F1_c1_hz = hf(dB1.signalOut); r.F1_c2_fresh_hz = hf(dB2.signalOut); r.F1_c2_reused_hz = hf(dA2.signalOut);
r.F1_c2_reused_signalIn_hz = hf(dA2.signalIn);
r.c1_identical = isequal(dA1.signalOut, dB1.signalOut);
r.c2_max_diff = max(abs(dA2.signalOut - dB2.signalOut));
r.logged_F1_c2_fresh_hz = median(dB2.fmts(round(0.35/fr):round(0.85/fr), 1)); r.logged_F1_c2_reused_hz = median(dA2.fmts(round(0.35/fr):round(0.85/fr), 1));
r.logged_sF1_c2_fresh_hz = median(dB2.sfmts(round(0.35/fr):round(0.85/fr), 1)); r.logged_sF1_c2_reused_hz = median(dA2.sfmts(round(0.35/fr):round(0.85/fr), 1));
lz = @(y) find(y ~= 0, 1) - 1;                                           % leading exact zeros (Audapter's output delay writes zeros first)
r.lead0_c1_in = lz(dB1.signalIn); r.lead0_c1_out = lz(dB1.signalOut); r.lead0_c2_reused_in = lz(dA2.signalIn); r.lead0_c2_fresh_in = lz(dB2.signalIn);
r.lead0_ms = 1000 * r.lead0_c2_reused_in / p.sr;
printf('cell array changed by runFrame: max|change| %.3g\n', chg);
printf('F1 heard: input %.0f, cond1 %.0f, cond2 fresh %.0f, cond2 reused %.0f Hz; cond2 reused signalIn F1 %.0f\n', r.F1_in_hz, r.F1_c1_hz, r.F1_c2_fresh_hz, r.F1_c2_reused_hz, r.F1_c2_reused_signalIn_hz);
printf('logged fmts/sfmts cond2: fresh %.0f/%.0f reused %.0f/%.0f; leading zeros: c1 in %d out %d, c2 fresh in %d, c2 reused in %d\n', r.logged_F1_c2_fresh_hz, r.logged_sF1_c2_fresh_hz, r.logged_F1_c2_reused_hz, r.logged_sF1_c2_reused_hz, r.lead0_c1_in, r.lead0_c1_out, r.lead0_c2_fresh_in, r.lead0_c2_reused_in);
k = 1:5:size(dB2.fmts, 1);
r.t = round((k-1) * fr * 1e4) / 1e4; r.rms_in = round(dB2.rms(k,1)' * 1e4) / 1e4;
r.F1_fresh = round(dB2.fmts(k,1))'; r.F1_reused = round(dA2.fmts(k,1))'; r.sF1_fresh = round(dB2.sfmts(k,1))'; r.sF1_reused = round(dA2.sfmts(k,1))';
od = report_outdir('i-04');
cl = struct('name', {'input', 'cond1_output', 'cond2_output_fresh', 'cond2_output_reused'}, ...
  'x', {dB1.signalIn, dB1.signalOut, dB2.signalOut, dA2.signalOut}, ...
  'label', {'Input: stored /a/ recording', 'Output, condition 1 (F1 +20 %)', 'Output, condition 2 (F1 −20 %), fresh frames', 'Output, condition 2 (F1 −20 %), same sigInCell reused'}, ...
  'warn', {'', '', '', ''});
r.audio = report_wavgroup(od, p.sr, cl);
report_json(fullfile(od, 'data.json'), r);
