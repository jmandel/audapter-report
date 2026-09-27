% Report asset export for F6 (blab "dropout fix": transDone never set, so the field perturbation re-arms on every
% re-entry into the perturbation field; minVowelLen has no effect). A question to the maintainers, not a bug claim.
% Field mode (no OST/PCF): F1 >= 600 Hz (any F2) is the field; F1 +20 % inside it (1D field, pertAmp 0.2, pertPhi 0).
% Scenario 1 (glide): /a/ -> /i/ -> /a/ in one 1.0 s vowel (F1 850 -> 310 -> 850 Hz, F2 1220 -> 2790 -> 1220 Hz).
% Scenario 2 (dip):   steady /a/ (F1 760 Hz) with a 40 ms F1 dip to 520 Hz at 0.6 s, standing in for a tracker excursion
%                     out of the field (the "dropout" the blab change addresses).
% Scenario 3: the glide again with minVowelLen = 1000 frames (upstream: re-arms; blab: identical to minVowelLen 60).
% Usage: ./run-oct.sh report_f6.m
%        VARIANT=upstream ./run-oct.sh report_f6.m build-upstream upstream/audapter_matlab
% Output: out/report/f6/<build>/{*.wav,data.json}
1;
function s = seg_of(on, fr)
  e = diff([0; on(:); 0]); s = [(find(e == 1) - 1) * fr, (find(e == -1) - 1) * fr];
end
function v = ifelse(c, a, b)
  if c, v = a; else, v = b; end
end
UP = strcmp(getenv('VARIANT'), 'upstream');
pf = '/h/oct/out/report/f6-params.mat';
if UP, load(pf); if isfield(p, 'pertF1'), p = rmfield(p, 'pertF1'); end
else
  p = defparams('female');
  p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0;
  p.F1Min = 600; p.F1Max = 5000; p.F2Min = 0; p.F2Max = 5000; p.LBk = 0; p.LBb = 0;
  p.pertF2 = linspace(0, 5000, 257); p.pertAmp = 0.2 * ones(1, 257); p.pertPhi = zeros(1, 257);
  save('-binary', pf, 'p');
end
fs = p.sr * p.downFact; fr = p.frameLen / p.sr; BW = [80 100 150 200];
n = round(1.0 * fs); tt = (0:n-1)' / n; s2 = sin(pi * tt).^2; f0 = 125 - 20 * tt;
Fg = [850 - 540 * s2, 1220 + 1570 * s2, 2810 * ones(n,1), 3800 * ones(n,1)];
xg = synth_vowel(fs, 1.0, f0, Fg, BW, 'onset', 0.1, 'offset', 0.2, 'amp', 0.3);
dip = 240 * exp(-0.5 * ((tt - 0.5) / 0.012).^2);                 % 40 ms dip (Gaussian, sd 12 ms) centred 0.5 s into the vowel
Fd = [760 - dip, 1150 * ones(n,1), 2500 * ones(n,1), 3500 * ones(n,1)];
xd = synth_vowel(fs, 1.0, f0, Fd, BW, 'onset', 0.1, 'offset', 0.2, 'amp', 0.3);
dg = run_trial(p, xg);
dd = run_trial(p, xd);
q = p; q.minVowelLen = 1000; dg1000 = run_trial(q, xg);
segs = @(d) seg_of(d.sfmts(:,1) > 0, fr);
r = struct();
r.build = ifelse(UP, 'upstream', 'blab'); r.frame_s = fr; r.F1Min = p.F1Min; r.minVowelLen = p.minVowelLen;
r.vowel_on_s = 0.1; r.vowel_off_s = 1.1; r.dip_center_s = 0.6;
r.glide_segments = segs(dg); r.dip_segments = segs(dd); r.glide1000_segments = segs(dg1000);
r.glide_n_shifted = nnz(dg.sfmts(:,1) > 0); r.glide1000_n_shifted = nnz(dg1000.sfmts(:,1) > 0);
r.glide1000_identical = isequal(dg.sfmts, dg1000.sfmts) && isequal(dg.signalOut, dg1000.signalOut);
% where the tracked F1 leaves / re-enters the field (first/last in-field frames of the glide, from Audapter's own track)
inF = dg.fmts(:,1) >= p.F1Min; e = diff([0; inF; 0]);
r.glide_field_runs = [(find(e == 1) - 1) * fr, (find(e == -1) - 1) * fr];
% F1 heard (independent LPC) in the final /a/ (0.95-1.05 s) and in the dip vowel after the dip (0.75-1.0 s)
hf = @(x, a, b) median(est_formants(x(round(a*p.sr):round(b*p.sr)), p.sr)(:,1), 'omitnan');
r.glide_last_a_F1_in_hz = hf(dg.signalIn, 0.95, 1.05); r.glide_last_a_F1_out_hz = hf(dg.signalOut, 0.95, 1.05);
r.glide_first_a_F1_in_hz = hf(dg.signalIn, 0.15, 0.25); r.glide_first_a_F1_out_hz = hf(dg.signalOut, 0.15, 0.25);
r.dip_after_F1_in_hz = hf(dd.signalIn, 0.75, 1.0); r.dip_after_F1_out_hz = hf(dd.signalOut, 0.75, 1.0);
printf('[%s] glide shifted: %s\n', r.build, mat2str(r.glide_segments, 4));
printf('[%s] dip shifted:   %s\n', r.build, mat2str(r.dip_segments, 4));
printf('[%s] glide minVowelLen=1000 shifted: %s identical=%d\n', r.build, mat2str(r.glide1000_segments, 4), r.glide1000_identical);
printf('[%s] F1 heard last /a/: in %.0f out %.0f; dip vowel after dip: in %.0f out %.0f\n', r.build, r.glide_last_a_F1_in_hz, r.glide_last_a_F1_out_hz, r.dip_after_F1_in_hz, r.dip_after_F1_out_hz);
k = 1:5:size(dg.fmts, 1); lg = @(v) round(v(k)' * 1e4) / 1e4;
r.t = round((k-1) * fr * 1e4) / 1e4;
r.rms_glide = lg(dg.rms(:,1)); r.rms_dip = lg(dd.rms(:,1));
r.F1_glide = round(dg.fmts(k,1))'; r.F1_dip = round(dd.fmts(k,1))';
r.sF1_glide = round(dg.sfmts(k,1))'; r.sF1_dip = round(dd.sfmts(k,1))';
od = report_outdir('f6');
c = struct('name', {'glide_input', 'glide_output', 'dip_input', 'dip_output'}, ...
  'x', {dg.signalIn, dg.signalOut, dd.signalIn, dd.signalOut}, ...
  'label', {'Input: /a/ → /i/ → /a/ glide', sprintf('Output (%s build): glide', r.build), 'Input: /a/ with a 40 ms F1 dip', sprintf('Output (%s build): /a/ with dip', r.build)}, ...
  'warn', {'', '', '', ''});
r.audio = report_wavgroup(od, p.sr, c);
r.params = struct('sr', p.sr, 'downFact', p.downFact, 'frameLen', p.frameLen, 'rmsThresh', p.rmsThresh, 'minVowelLen', p.minVowelLen, 'F1Min', p.F1Min);
if ~UP
  audiowrite(fullfile(od, 'dev_glide_48k.wav'), xg, fs, 'BitsPerSample', 16);
  audiowrite(fullfile(od, 'dev_dip_48k.wav'), xd, fs, 'BitsPerSample', 16);
end
report_json(fullfile(od, 'data.json'), r);

