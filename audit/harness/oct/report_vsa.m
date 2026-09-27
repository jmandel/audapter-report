% Report export for the three lab-script cards (EXP-4/5): the public VSA runners' parameter sequences, as in
% exp_vsa_field.m, at strength 0 and 0.5 on every vowel, with output WAVs for independent measurement, plus the fb 4 gain.
% Usage: ./run-oct.sh report_vsa.m   Output: out/report/vsa-{centralize,generalize,fb4}/blab/data.json, out/report/vsa-meas/*.wav
FS = '/a/other/blab-experiments/free-speech';
addpath(fullfile(FS, 'experiment_helpers'), '-end'); addpath(fullfile(FS, 'utils'), '-end');
addpath(fullfile(FS, 'speech'), '-end'); addpath('/h/oct/exp_shims');
fieldDim = 257; mel2hz_ = @(m) (exp(m / 1127.01048) - 1) * 700;
% the lab's default corner vowels (calc_pertField.m:31-34; Hillenbrand men), passed explicitly
fm = struct('iy', [342 2322], 'uw', [378 997], 'ae', [588 1952], 'aa', [768 1333]);
pf = calc_pertField('in', fm, 1, 0);          % bMel = 1, no plot
pf.nLPC = 17;                                  % stands for the per-participant nlpc (male default)
cen = pf.fCen;                                 % centre in mel
printf('calc_pertField: F1Min..F1Max %.1f..%.1f mel, F2Min..F2Max %.1f..%.1f, centre (%.1f, %.1f) mel = (%.0f, %.0f) Hz\n', ...
       pf.F1Min, pf.F1Max, pf.F2Min, pf.F2Max, cen(1), cen(2), mel2hz_(cen(1)), mel2hz_(cen(2)));
% --- expt.audapterParams as each expt function assembles it
hzgrid = @(a, b) floor(a:(b-a)/(fieldDim-1):b);
g.F1Min = 200; g.F1Max = 1500; g.F2Min = 500; g.F2Max = 3500;
A.sent = g; A.sent.pertF1 = hzgrid(200, 1500); A.sent.pertF2 = hzgrid(500, 3500);
A.sent.pertAmp2D = zeros(fieldDim); A.sent.pertPhi2D = zeros(fieldDim); A.sent.bShift2D = 1;
A.cent = g; A.cent.pertf1 = hzgrid(200, 1500); A.cent.pertf2 = hzgrid(500, 3500);
A.cent.pertAmp2D = zeros(fieldDim); A.cent.pertPhi2D = zeros(fieldDim); A.cent.bShift2D = 1;
A.gen = g; A.gen.pertf1 = hzgrid(200, 1500); A.gen.pertf2 = hzgrid(500, 3500);
A.gen.pertAmp = zeros(1, fieldDim); A.gen.pertPhi = zeros(1, fieldDim);
names = {'sent', 'cent', 'gen'}; labels = {'vsaSentence', 'vsaCentralize', 'vsaGeneralize'};
for k = 1:3, A.(names{k}) = add2struct(A.(names{k}), pf); end
% --- stimuli: male vowels (F0 120) at the corner means and two untrained vowels (Hillenbrand men)
V = {'iy', [342 2322 3000 3657]; 'ae', [588 1952 2601 3500]; 'aa', [768 1333 2522 3500]; 'uw', [378 997 2343 3500]; ...
     'ih', [427 2034 2684 3500]; 'eh', [580 1799 2605 3500]};
BW = [60 90 150 200];
fs = 48000; hz2mel = @(f) 1127.01048 * log(1 + f / 700);

% ---- report export: every wiring at strength 0 and 0.5, per vowel; logged shift (sfmts vs fmts) and output WAVs
% fb 1 here (voice only) so formants can be measured on the audio; the experiments run fb 3 with babble at 0.02,
% which does not change the field lookup.
md = '/h/oct/out/report/vsa-meas'; if ~exist(md, 'dir'), mkdir(md); end
R = struct(); mel2hz = mel2hz_;
for k = 1:3
  ap = A.(names{k});
  p = getAudapterDefaultParams('male'); p = add2struct(p, ap);
  p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1; p.fb = 1;
  if k == 1, p.bShift2D = 1; end
  Audapter('ost', '', 0); Audapter('pcf', '', 0); AudapterIO('init', p);
  switch names{k}
    case 'sent', Audapter(3, 'pertf1', p.pertF1); Audapter(3, 'pertf2', p.pertF2); Audapter(3, 'pertAmp2D', p.pertAmp2D); Audapter(3, 'pertPhi2D', p.pertPhi2D);
    case 'cent', Audapter(3, 'pertf1', p.pertf1); Audapter(3, 'pertf2', p.pertf2); Audapter(3, 'pertAmp2D', p.pertAmp2D); Audapter(3, 'pertPhi2D', p.pertPhi2D);
    case 'gen',  Audapter(3, 'pertf1', p.pertf1); Audapter(3, 'pertf2', p.pertf2); Audapter(3, 'pertAmp', p.pertAmp); Audapter(3, 'pertPhi', p.pertPhi);
  end
  if k == 1, run_trial(p, synth_vowel(fs, 0.45, 120, V{1,2}, BW, 'onset', 0.2, 'offset', 0.2, 'amp', 0.3), 'init', false); end   % warm-up: the first trial of a process logs different onset formants (EXP-10)
  g1 = Audapter('getParam', 'pertf1'); g2 = Audapter('getParam', 'pertf2');
  R.(names{k}).grid = [g1(1) g1(end) g2(1) g2(end)]; R.(names{k}).bShift2D = Audapter('getParam', 'bshift2d');
  for s = [0 0.5]
    switch names{k}
      case 'gen', p.pertAmp = s * ap.pertAmp; Audapter('setParam', 'pertAmp', p.pertAmp);
      otherwise,  p.pertAmp2D = s * ap.pertAmp2D; Audapter('setParam', 'pertAmp2D', p.pertAmp2D);
    end
    tag = sprintf('s%02d', round(10*s));
    for v = 1:size(V, 1)
      x = synth_vowel(fs, 0.45, 120, V{v,2}, BW, 'onset', 0.2, 'offset', 0.2, 'amp', 0.3);
      d = run_trial(p, x, 'init', false);
      ix = find(d.fmts(:,1) > 0 & d.sfmts(:,1) > 0); ix = ix(round(end*0.3):round(end*0.7));
      P = [median(hz2mel(d.fmts(ix,1))) median(hz2mel(d.fmts(ix,2)))];
      H = [median(hz2mel(d.sfmts(ix,1))) median(hz2mel(d.sfmts(ix,2)))];
      e = struct('vowel', V{v,1}, 'prod_mel', P, 'heard_mel', H, 'intended_mel', P + s * (cen - P), ...
                 'prod_hz', mel2hz(P), 'heard_hz', mel2hz(H), 'intended_hz', mel2hz(P + s * (cen - P)));
      R.(names{k}).(tag)(v) = e;
      audiowrite(fullfile(md, sprintf('%s_%s_%s_out.wav', names{k}, tag, V{v,1})), d.signalOut / 1.5, p.sr, 'BitsPerSample', 16);
      if k == 1 && s == 0, audiowrite(fullfile(md, sprintf('in_%s.wav', V{v,1})), d.signalIn / 1.5, p.sr, 'BitsPerSample', 16); end
      printf('%s %s %s: produced %4.0f/%4.0f Hz, heard %4.0f/%4.0f Hz, intended %4.0f/%4.0f Hz\n', names{k}, tag, V{v,1}, e.prod_hz, e.heard_hz, e.intended_hz);
    end
  end
  PS.(names{k}) = p;
end
Audapter('ost', '', 0); Audapter('pcf', '', 0);

% ---- real vowels (PVQD, CC BY 4.0): sustained /i/ and /a/ of a male speaker without dysphonia, 1.2 s cut from 0.5 s,
% through each wiring at strength 0 and 0.5 (the lab's field is built from default corner means, so it applies as it
% would to a new participant before calibration)
Mc = corpus_index(); RV = struct(); rid = {'pvqd_LA9015_i', 'pvqd_LA9015_a'};
for k = 1:3
  ap = A.(names{k});
  p = getAudapterDefaultParams('male'); p = add2struct(p, ap); p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1; p.fb = 1;
  if k == 1, p.bShift2D = 1; end
  Audapter('ost', '', 0); Audapter('pcf', '', 0); AudapterIO('init', p);
  switch names{k}
    case 'sent', Audapter(3, 'pertf1', p.pertF1); Audapter(3, 'pertf2', p.pertF2); Audapter(3, 'pertAmp2D', p.pertAmp2D); Audapter(3, 'pertPhi2D', p.pertPhi2D);
    case 'cent', Audapter(3, 'pertf1', p.pertf1); Audapter(3, 'pertf2', p.pertf2); Audapter(3, 'pertAmp2D', p.pertAmp2D); Audapter(3, 'pertPhi2D', p.pertPhi2D);
    case 'gen',  Audapter(3, 'pertf1', p.pertf1); Audapter(3, 'pertf2', p.pertf2); Audapter(3, 'pertAmp', p.pertAmp); Audapter(3, 'pertPhi', p.pertPhi);
  end
  for s = [0 0.5]
    switch names{k}
      case 'gen', p.pertAmp = s * ap.pertAmp; Audapter('setParam', 'pertAmp', p.pertAmp);
      otherwise,  p.pertAmp2D = s * ap.pertAmp2D; Audapter('setParam', 'pertAmp2D', p.pertAmp2D);
    end
    tag = sprintf('s%02d', round(10*s));
    for i = 1:numel(rid)
      m = Mc(strcmp({Mc.id}, rid{i})); x = corpus_wav(m); x = x(round(0.5*fs)+1:round(1.7*fs));
      d = run_trial(p, x, 'init', false);
      ix = find(d.fmts(:,1) > 0 & d.sfmts(:,1) > 0); ix = ix(round(end*0.2):round(end*0.8));
      P = [median(hz2mel(d.fmts(ix,1))) median(hz2mel(d.fmts(ix,2)))]; H = [median(hz2mel(d.sfmts(ix,1))) median(hz2mel(d.sfmts(ix,2)))];
      nm = strrep(rid{i}, 'pvqd_LA9015_', '');
      RV.(names{k}).(tag).(nm) = struct('prod_hz', mel2hz(P), 'heard_hz', mel2hz(H), 'intended_hz', mel2hz(P + s * (cen - P)));
      audiowrite(fullfile(md, sprintf('real_%s_%s_%s_out.wav', names{k}, tag, nm)), d.signalOut / 1.5, p.sr, 'BitsPerSample', 16);
      if k == 1 && s == 0, audiowrite(fullfile(md, sprintf('real_in_%s.wav', nm)), d.signalIn / 1.5, p.sr, 'BitsPerSample', 16); end
      printf('real %s %s %s: produced %4.0f/%4.0f heard %4.0f/%4.0f intended %4.0f/%4.0f Hz\n', names{k}, tag, nm, mel2hz(P), mel2hz(H), mel2hz(P + s * (cen - P)));
    end
  end
end
R.real = RV; R.real_ids = rid;
% fb 4 with a real sentence (speech-modulated noise follows the voice)
xr = corpus_wav(Mc(strcmp({Mc.id}, 'arctic_bdl_a0005')));
R.centre_mel = cen; R.centre_hz = mel2hz(cen); R.fm = fm; R.field = struct('F1Min', pf.F1Min, 'F1Max', pf.F1Max, 'F2Min', pf.F2Min, 'F2Max', pf.F2Max);
% fb 4 gain: speech-modulated noise, as committed (p.fb4Gain = 0.98, not forwarded) vs the intended gain
p = getAudapterDefaultParams('male'); p.fb = 4; p.fb4Gain = 0.98; w = get_noiseSource(p);
x = synth_vowel(fs, 1.0, 120, V{3,2}, BW, 'onset', 0.2, 'offset', 0.3, 'amp', 0.3);
Audapter('ost', '', 0); Audapter('pcf', '', 0);
AudapterIO('init', p); Audapter('setParam', 'datapb', w, 1); d1 = run_trial(p, x, 'init', false); g_c = Audapter('getParam', 'fb4gaindb');
q = p; q.fb4GainDB = 20*log10(0.98); AudapterIO('init', q); Audapter('setParam', 'datapb', w, 1); d2 = run_trial(q, x, 'init', false);
audiowrite(fullfile(md, 'fb4_committed.wav'), d1.signalOut, p.sr, 'BitsPerSample', 16);
audiowrite(fullfile(md, 'fb4_intended.wav'), d2.signalOut, p.sr, 'BitsPerSample', 16);
audiowrite(fullfile(md, 'fb4_in.wav'), d1.signalIn, p.sr, 'BitsPerSample', 16);
AudapterIO('init', p); Audapter('setParam', 'datapb', w, 1); e1 = run_trial(p, xr, 'init', false);
AudapterIO('init', q); Audapter('setParam', 'datapb', w, 1); e2 = run_trial(q, xr, 'init', false);
audiowrite(fullfile(md, 'fb4_real_committed.wav'), e1.signalOut, p.sr, 'BitsPerSample', 16);
audiowrite(fullfile(md, 'fb4_real_intended.wav'), e2.signalOut, p.sr, 'BitsPerSample', 16);
audiowrite(fullfile(md, 'fb4_real_in.wav'), e1.signalIn, p.sr, 'BitsPerSample', 16);
R.fb4 = struct('rms_committed', rms(d1.signalOut), 'rms_intended', rms(d2.signalOut), 'diff_db', 20*log10(rms(d1.signalOut) / rms(d2.signalOut)), 'fb4GainDB_committed', g_c, 'fb4GainDB_intended', Audapter('getParam', 'fb4gaindb'));
printf('fb4: committed %.4f intended %.4f -> %+.1f dB (fb4GainDB in effect %g vs %g)\n', R.fb4.rms_committed, R.fb4.rms_intended, R.fb4.diff_db, R.fb4.fb4GainDB_committed, R.fb4.fb4GainDB_intended);
common = {'input', 'synthetic male vowels (F0 120 Hz) at Hillenbrand men''s means for /i/, /ae/, /a/, /u/ (the lab''s default corner vowels) and /I/, /E/', ...
          'sequence', {{'strength 0 (baseline)', 'strength 0.5 (hold / train)'}}};
sp = struct('pertf1', 'Hz grid 200..1500 (p.pertf1, lower case), re-sent after init', 'pertf2', 'Hz grid 500..3500 (p.pertf2), re-sent after init', ...
            'pertAmp2D', 'calc_pertField field x strength, set before every trial', 'pertPhi2D', 'calc_pertField angles, re-sent after init');
r = R; r.settings = report_settings(PS.cent, 'male', 'setparam', sp, 'switching', 'setParam pertAmp2D = strength x field before every trial (run_vsaAdapt2_audapter.m:104-105); AudapterIO(''init'') once', common{:});
report_json(fullfile(report_outdir('vsa-centralize'), 'data.json'), r);
sp = struct('pertf1', 'Hz grid 200..1500 (p.pertf1), re-sent after init', 'pertf2', 'Hz grid 500..3500 (p.pertf2), re-sent after init', ...
            'pertAmp', '1-D field (all zeros) x strength, set before every trial', 'pertPhi', '1-D angles (all zeros)', 'pertAmp2D', 'full-strength calc_pertField field, sent once by AudapterIO(''init'') (bShift2D = 1)');
r = R; r.settings = report_settings(PS.gen, 'male', 'setparam', sp, 'switching', 'setParam pertAmp = strength x p.pertAmp before every trial (run_vsaGeneralize_audapter.m:117-118); AudapterIO(''init'') once', common{:});
report_json(fullfile(report_outdir('vsa-generalize'), 'data.json'), r);
r = struct('fb4', R.fb4); r.settings = report_settings(p, 'male', 'setparam', struct('datapb', 'bundled babble via free-speech get_noiseSource'), ...
  'switching', 'generalization phases: fb 4 (speech-modulated noise)', 'input', 'synthetic male /a/ (F0 120 Hz), 1 s');
report_json(fullfile(report_outdir('vsa-fb4'), 'data.json'), r);
