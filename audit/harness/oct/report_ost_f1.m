% Report asset export for OST-F1 (OST state carries over between trials; OST_TAB::reset() is never called), in a
% realistic MIXED design (FINDINGS-LOG EXP-9 / exp_mixed.m S5, COORD-3):
%   "shift the first word": two-word trials, F1 +125 mel in OST state 2 (from the detected onset of word 1 to its
%   detected offset), catch trials interleaved (the same PCF with a zero row), blab's standard settings (female preset,
%   16 kHz, frameLen 32, fb 3 with the bundled babble at fb3Gain 0.02, bMelShift 1), OST loaded once, PCF reloaded
%   per trial, reset() per trial, as in blab's PCF-switching runners.
% Two onset rules for the same design:
%   safe: INTENSITY_RISE_HOLD_POS_SLOPE -> INTENSITY_FALL (the rules of free-speech measureFormants.ost)
%   leak: INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR (blab's own mode 32) -> INTENSITY_FALL
% Observed = one session, as run. Expected = every trial in a fresh process (first trial after loading the MEX), which is what the
% one-line fix gives (Lean proof trial_independent). Per-trial WAVs go to out/report/ost-f1/meas/ for the report's
% independent per-word measurements; a few are published as clips.
% Usage: for d in safe leak; do for k in 1 2 3 4 5 6 7 8; do SCEN="fresh $d $k" ./run-oct.sh report_ost_f1.m; done; done; SCEN=same ./run-oct.sh report_ost_f1.m
%        ./run-oct.sh report_ost_f1.m      (report/export-all.sh does both)   Output: out/report/ost-f1/blab/{*.wav,data.json}, out/report/ost-f1/meas/*.wav
addpath('/a/other/blab-experiments/free-speech/experiment_helpers', '-end');
p = getAudapterDefaultParams('female'); p.downFact = 3; p.sr = 16000; p.frameLen = 32;
p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1; p.fb = 3; p.fb3Gain = 0.02;
fs = p.sr * p.downFact; fr = p.frameLen / p.sr; w = get_noiseSource(p);
EH = [731 2058 2979 4000]; V2 = [500 1500 2600 4000]; BW = [80 100 150 200];
randn('seed', 5);
w1 = [0.30 0.35 1.20 0.30 0.40 0.90 0.35 0.30]; catchT = [0 0 1 0 0 1 0 0]; T = numel(w1);
G1 = 0.15; P12 = 0.25; W2 = 0.5; TAIL = 0.3;                 % silence before word 1, pause, word 2, silence after
X = cell(1, T); sc = strsplit(strtrim(getenv('SCEN'))); REAL = strcmp(sc{1}, 'real'); PF = ifelse_str(REAL, 'real_', '');
if REAL, sc = sc(2:end); if isempty(sc), sc = {''}; end, end   % SCEN="real ...": the same runs on real voice (run-oct.sh passes only SCEN/VARIANT)
if REAL   % real voice: word 1 = a sustained /a/, word 2 = a sustained /i/, both PVQD speaker SJ7001 (female), cut to length
  Mc = corpus_index(); ra = corpus_wav(Mc(strcmp({Mc.id}, 'pvqd_SJ7001_a')), 0.06); ri = corpus_wav(Mc(strcmp({Mc.id}, 'pvqd_SJ7001_i')), 0.06);
  cutv = @(y, d) y(round(0.3*fs) + (1:round(d*fs))) .* [linspace(0,1,round(0.01*fs))'; ones(round(d*fs) - 2*round(0.01*fs), 1); linspace(1,0,round(0.01*fs))'];
end
for k = 1:T
  if REAL
    X{k} = [1e-4*randn(round(G1*fs),1); cutv(ra, w1(k)); 1e-4*randn(round(P12*fs),1); cutv(ri, W2); 1e-4*randn(round(TAIL*fs),1)];
  else
    X{k} = [1e-4*randn(round(G1*fs),1); synth_vowel(fs, w1(k), 210, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3); ...
            1e-4*randn(round(P12*fs),1); synth_vowel(fs, W2, 200, V2, BW, 'onset', 0, 'offset', 0, 'amp', 0.3); 1e-4*randn(round(TAIL*fs),1)];
  end
end
PCF_ON = sprintf('0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 125, 0\n3, 0.0, 0, 0, 0\n');
PCF_OFF = sprintf('0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n');
fid = fopen('cfg/report_ostf1_on.pcf', 'w'); fprintf(fid, '%s', PCF_ON); fclose(fid);
fid = fopen('cfg/report_ostf1_off.pcf', 'w'); fprintf(fid, '%s', PCF_OFF); fclose(fid);
OSTS = {'safe', sprintf('rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD_POS_SLOPE 0.01 0.05 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n'); ...
        'leak', sprintf('rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR 0.2 0.02 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n')};
md = '/h/oct/out/report/ost-f1/meas'; if ~exist(md, 'dir'), mkdir(md); end
od = report_outdir('ost-f1');
wr = @(f, y) audiowrite(fullfile(md, f), y / 1.5, p.sr, 'BitsPerSample', 16);
t3of = @(d) min([(find(d.ost_stat >= 3, 1) - 1) * fr, NaN]);   % NaN if never detected
r = struct('frame_s', fr, 'w1', w1, 'catch', catchT, 'g1', G1, 'p12', P12, 'w2', W2, 'tail', TAIL);
r.trial_s = arrayfun(@(k) numel(X{k}) / fs, 1:T);
for di = 1:2
  fid = fopen(sprintf('cfg/report_ostf1_%s.ost', OSTS{di,1}), 'w'); fprintf(fid, '%s', OSTS{di,2}); fclose(fid);
end
if strcmp(sc{1}, 'fresh')
  % EXPECTED: one trial in a fresh process (the first trial after the MEX is loaded), i.e. what the fix gives.
  % (clear mex does not reload Audapter's statics in Octave, so each expected trial needs its own process.)
  nm = sc{2}; k = str2double(sc{3});
  Audapter('setParam', 'datapb', w, 1); AudapterIO('init', p); Audapter('ost', sprintf('cfg/report_ostf1_%s.ost', nm), 0);
  Audapter('pcf', ifelse_str(catchT(k), 'cfg/report_ostf1_off.pcf', 'cfg/report_ostf1_on.pcf'), 0);
  q = exp_trial(p, X{k});
  wr(sprintf('%s%s_t%d_exp.wav', PF, nm, k), q.d.signalOut);
  report_json(fullfile(md, sprintf('%s%s_t%d_exp.json', PF, nm, k)), struct('t3', t3of(q.d), 'on', q.on, 'off', q.off, 'shift_s', q.shift_s, 'dF1mel', q.dF1mel));
  printf('fresh %s trial %d: offset detected %.3f s, shift %.3f-%.3f s\n', nm, k, t3of(q.d), q.on, q.off);
  return;
end
if strcmp(sc{1}, 'same')
  % identical trials in a row from a fresh process (no long trial at all): the leak design's offset creeps later every trial
  Audapter('setParam', 'datapb', w, 1); AudapterIO('init', p);
  Audapter('ost', 'cfg/report_ostf1_leak.ost', 0); Audapter('pcf', 'cfg/report_ostf1_on.pcf', 0); t = zeros(1, 10);
  for k = 1:10, q = exp_trial(p, X{1}); t(k) = t3of(q.d); end
  printf('leak design, 10 identical trials (word 1 %.2f s) from a fresh start: offsets %s\n', w1(1), mat2str(t, 4));
  report_json(fullfile(md, [PF 'same.json']), struct('t3', t)); return;
end
for di = [2 1]   % leak design first, so its session starts on a freshly loaded MEX
  nm = OSTS{di,1}; ost = sprintf('cfg/report_ostf1_%s.ost', nm);
  % OBSERVED: one session, OST loaded once, PCF reloaded per trial, reset() per trial
  if di == 2 && ~REAL, case_mark('observed'); end   % Playground test case (audit/playground/capture); no-op otherwise
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
  Audapter('setParam', 'datapb', w, 1); AudapterIO('init', p); Audapter('ost', ost, 0);
  obs = cell(1, T);
  for k = 1:T
    Audapter('pcf', ifelse_str(catchT(k), 'cfg/report_ostf1_off.pcf', 'cfg/report_ostf1_on.pcf'), 0);
    obs{k} = exp_trial(p, X{k});
  end
  case_mark('');
  R = struct('t3_obs', zeros(1,T), 't3_exp', zeros(1,T), 'on_obs', zeros(1,T), 'off_obs', zeros(1,T), 'on_exp', zeros(1,T), 'off_exp', zeros(1,T), ...
             'shift_obs', zeros(1,T), 'shift_exp', zeros(1,T), 'dF1mel_obs', zeros(1,T), 'dF1mel_exp', zeros(1,T));
  for k = 1:T
    e = jsondecode(fileread(fullfile(md, sprintf('%s%s_t%d_exp.json', PF, nm, k))));
    nn = @(v) [v NaN](1);   % JSON null (NaN) reads back as []
    R.t3_obs(k) = t3of(obs{k}.d); R.t3_exp(k) = nn(e.t3);
    R.on_obs(k) = obs{k}.on; R.off_obs(k) = obs{k}.off; R.on_exp(k) = nn(e.on); R.off_exp(k) = nn(e.off);
    R.shift_obs(k) = obs{k}.shift_s; R.shift_exp(k) = e.shift_s; R.dF1mel_obs(k) = obs{k}.dF1mel; R.dF1mel_exp(k) = e.dF1mel;
    printf('%s trial %d (%s, word 1 %.2f s): offset detected obs %.3f exp %.3f s | F1 +125 mel obs %.3f-%.3f exp %.3f-%.3f s\n', nm, k, ...
      ifelse_str(catchT(k), 'catch', 'shift'), w1(k), R.t3_obs(k), R.t3_exp(k), R.on_obs(k), R.off_obs(k), R.on_exp(k), R.off_exp(k));
    wr(sprintf('%s%s_t%d_in.wav', PF, nm, k), obs{k}.d.signalIn); wr(sprintf('%s%s_t%d_obs.wav', PF, nm, k), obs{k}.d.signalOut);
  end
  r.(nm) = R;
  if strcmp(nm, 'leak'), OBS = obs; end
end
EXP4 = 1.5 * audioread(fullfile(md, [PF 'leak_t4_exp.wav']));
% OST reload before every trial does not help (EXP-9): leak design, OST reloaded each trial, same sequence
Audapter('ost', '', 0); Audapter('pcf', '', 0); Audapter('setParam', 'datapb', w, 1); AudapterIO('init', p);
for k = 1:T
  Audapter('ost', 'cfg/report_ostf1_leak.ost', 0);
  Audapter('pcf', ifelse_str(catchT(k), 'cfg/report_ostf1_off.pcf', 'cfg/report_ostf1_on.pcf'), 0);
  q = exp_trial(p, X{k}); r.reload_t3(k) = t3of(q.d); r.reload_off(k) = q.off;
end
printf('leak design, OST reloaded before every trial: offsets %s\n', mat2str(r.reload_t3, 4));
if REAL, r.same_t3 = []; else, r.same_t3 = jsondecode(fileread(fullfile(md, 'same.json'))).t3'; end   % from SCEN=same (fresh process)
Audapter('ost', '', 0); Audapter('pcf', '', 0);
if REAL, report_json(fullfile(md, 'real.json'), r); return; end
% published clips (one shared gain): trial 4 input, expected, observed, and an A/B clip (expected, then observed)
gap = zeros(round(0.5 * p.sr), 1);
c = struct('name', {'t4_input', 't4_expected', 't4_observed', 't4_ab', 't7_observed'}, ...
  'x', {OBS{4}.d.signalIn, EXP4, OBS{4}.d.signalOut, [EXP4; gap; OBS{4}.d.signalOut], OBS{7}.d.signalOut}, ...
  'label', {'Input, trial 4', 'Expected, trial 4', 'Observed, trial 4', 'A/B: expected trial 4, then observed trial 4', 'Observed, trial 7'}, 'warn', {'', '', '', '', ''});
r.audio = report_wavgroup(od, p.sr, c);
r.ab_gap_s = numel(gap) / p.sr;
% device-rate inputs (unscaled) of the figure's trials 1-5 for the in-browser panel
for k = 1:5, audiowrite(fullfile(od, sprintf('dev_t%d_48k.wav', k)), X{k}, fs, 'BitsPerSample', 16); end
seq = arrayfun(@(k) sprintf('%s (word 1 %.2f s)', ifelse_str(catchT(k), 'catch', 'shift'), w1(k)), 1:T, 'UniformOutput', false);
r.settings = report_settings(p, 'female', 'ost', OSTS{2,2}, 'ost_safe', OSTS{1,2}, 'pcf', PCF_ON, 'pcf_catch', PCF_OFF, ...
  'setparam', struct('datapb', 'bundled babble mtbabble48k.wav, loaded with free-speech get_noiseSource (479,230 samples)'), ...
  'sequence', {seq}, 'switching', 'OST loaded once; PCF reloaded before every trial (the shift PCF, or the zero PCF on catch trials); reset() before every trial', ...
  'input', sprintf('synthetic two-word trials: word 1 = /%s/-like vowel (F0 210 Hz, formants %s Hz), word 2 = /%s/-like vowel 0.5 s (F0 200 Hz, formants %s Hz); %.2f s silence before word 1, %.2f s pause', ...
                   'ae', mat2str(EH), 'e', mat2str(V2), G1, P12));
report_json(fullfile(od, 'data.json'), r);

