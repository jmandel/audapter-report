% Report asset export for COORD-1 (a loaded OST/PCF persists across AudapterIO('init') and overrides later field-mode
% experiments). Same design as t_pcf_persist.m: a 1D-field F1 +20 % experiment in a fresh session, then an earlier PCF
% experiment (example_data pitch_pert.pcf with a one-state OST), then the same field experiment again after init only.
% Synthetic /a/ plus one real sentence from the corpus (ARCTIC bdl "I had faith in them.").
% Usage: ./run-oct.sh report_coord1.m      Output: out/report/coord-1/blab/{*.wav,data.json}, out/report/coord-1/real/
g = linspace(0, 5000, 257);
field = @(p) setfield(setfield(setfield(setfield(setfield(setfield(setfield(setfield(setfield(setfield(setfield(setfield(setfield(p, ...
  'bShift', 1), 'bRatioShift', 1), 'bMelShift', 0), 'F1Min', 0), 'F1Max', 5000), 'F2Min', 0), 'F2Max', 5000), 'LBk', 0), 'LBb', 0), ...
  'pertF2', g), 'pertAmp', 0.2*ones(1,257)), 'pertPhi', zeros(1,257)), 'pertF1', g);
PCF = '/a/blab/audapter_matlab/example_data/pitch_pert.pcf';
function r = pair(p, q, x, PCF, fr)
  Audapter('ost', '', 0); Audapter('pcf', '', 0);            % a genuinely fresh start for the control
  d0 = run_trial(q, x);                                        % field experiment, no PCF ever loaded
  run_trial(p, x, 'ost', 'cfg/one.ost', 'pcf', PCF);           % an earlier PCF experiment in the same session
  d1 = run_trial(q, x);                                        % the field experiment again: AudapterIO('init') only
  r.d0 = d0; r.d1 = d1; r.fresh = nnz(d0.sfmts(:,1)); r.after = nnz(d1.sfmts(:,1)); r.frame_s = fr;
  k = 1:2:size(d0.sfmts, 1); r.t = round((k-1) * fr * 1e4) / 1e4;
  r.sh0 = double(d0.sfmts(k,1)' > 0); r.sh1 = double(d1.sfmts(k,1)' > 0); r.rms = round(d0.rms(k,1)' * 1e4) / 1e4;
  F0 = est_formants(d0.signalOut, q.sr); F1 = est_formants(d1.signalOut, q.sr); Fi = est_formants(d0.signalIn, q.sr);
  r.F1_in = median(Fi(:,1), 'omitnan'); r.F1_fresh = median(F0(:,1), 'omitnan'); r.F1_after = median(F1(:,1), 'omitnan');
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
end
p = defparams('female'); fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
x = synth_vowel(fs, 0.8, 120, [850 1220 2810 3800], [80 100 150 200]);
R = pair(p, field(p), x, PCF, fr);
printf('synthetic: shifted frames fresh %d, after PCF experiment %d; F1 heard in %.0f fresh %.0f after %.0f Hz\n', R.fresh, R.after, R.F1_in, R.F1_fresh, R.F1_after);
od = report_outdir('coord-1');
c = struct('name', {'input', 'output_fresh', 'output_after_pcf'}, 'x', {R.d0.signalIn, R.d0.signalOut, R.d1.signalOut}, ...
  'label', {'Input: synthetic /a/', 'Field experiment in a fresh session: F1 +20 %', 'The same field experiment after an earlier PCF experiment and AudapterIO(''init'')'}, 'warn', {'', '', ''});
out = rmfield(R, {'d0', 'd1'}); out.audio = report_wavgroup(od, p.sr, c); out.pcf = fileread(PCF);
report_json(fullfile(od, 'data.json'), out);
% real speech
M = corpus_index(); m = M(strcmp({M.id}, 'arctic_bdl_a0030')); xr = corpus_wav(m); pm = defparams(corpus_preset(m));
Q = pair(pm, field(pm), xr, PCF, pm.frameLen / pm.sr);
printf('real %s: shifted frames fresh %d, after %d\n', m.id, Q.fresh, Q.after);
rd = fullfile('/h/oct/out/report/coord-1/real'); if ~exist(rd, 'dir'), mkdir(rd); end
c = struct('name', {'input', 'output_fresh', 'output_after_pcf'}, 'x', {Q.d0.signalIn, Q.d0.signalOut, Q.d1.signalOut}, ...
  'label', {'Input', 'Fresh session: F1 +20 %', 'After an earlier PCF experiment'}, 'warn', {'', '', ''});
o2 = rmfield(Q, {'d0', 'd1'}); o2.clip = m.id; o2.audio = report_wavgroup(rd, pm.sr, c);
report_json(fullfile(rd, 'data.json'), o2);
