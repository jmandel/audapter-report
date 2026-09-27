% Report asset export for COORD-1 (an OST/PCF loaded earlier in the session survives AudapterIO('init') and overrides a
% later field-mode experiment), with blab's own files and session structure (FINDINGS-LOG EXP-7, exp_mixed.m S3):
%   every blab formant session starts with free-speech's measureFormants calibration block (measureFormants.ost/.pcf,
%   an all-zero PCF), then runs the experiment. A field-mode experiment like attentionComp (pertAmp/pertPhi set per
%   trial, 125 mel, fb 3 with the bundled babble at 0.02) clears the OST and PCF before AudapterIO('init') with
%   Audapter('ost', '', 0); Audapter('pcf', '', 0). Expected = with those two lines, observed = without them.
%   Second arm (numbers only): a SimOn hold block (bedhead OST, 125 mel PCF) followed by a field "noShift" trial.
% Usage: ./run-oct.sh report_coord1.m      Output: out/report/coord-1/blab/data.json, out/report/coord-1/meas/*.wav
addpath('/a/other/blab-experiments/free-speech/experiment_helpers', '-end');
R = '/a/other/blab-experiments';
MF_OST = [R '/free-speech/experiment_helpers/measureFormants.ost']; MF_PCF = [R '/free-speech/experiment_helpers/measureFormants.pcf'];
p = getAudapterDefaultParams('female'); p.downFact = 3; p.sr = 16000; p.frameLen = 32;
p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1; p.fb = 3; p.fb3Gain = 0.02;
pc = p; pc.bShift = 0;                                             % calibration block: no shift
fs = p.sr * p.downFact; w = get_noiseSource(p);
EH = [731 2058 2979 4000]; BW = [80 100 150 200]; randn('seed', 5);
G1 = 0.35; WD = 0.40; TAIL = 0.6;
word = @(f0) [1e-4*randn(round(G1*fs),1); synth_vowel(fs, WD, f0, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); 1e-4*randn(round(TAIL*fs),1)];
seq = {'calibration', 'calibration', 'shift', 'noShift', 'shift'}; f0s = [205 212 210 208 206];
X = arrayfun(@(k) word(f0s(k)), 1:numel(seq), 'UniformOutput', false);
md = '/h/oct/out/report/coord-1/meas'; if ~exist(md, 'dir'), mkdir(md); end
wr = @(f, y) audiowrite(fullfile(md, f), y / 1.5, p.sr, 'BitsPerSample', 16);
r = struct('g1', G1, 'wd', WD, 'trial_s', numel(X{1}) / fs, 'sequence', {seq});
for arm = {'exp', 'obs'}
  case_mark(arm{1});                                                                       % Playground test case capture
  Audapter('setParam', 'datapb', w, 1);
  Audapter('ost', MF_OST, 0); Audapter('pcf', MF_PCF, 0); AudapterIO('init', pc);        % calibration block
  for k = 1:numel(seq)
    if k == 3                                                                              % experiment block starts
      if strcmp(arm{1}, 'exp'), Audapter('ost', '', 0); Audapter('pcf', '', 0); end        % the runner's two clear lines
      AudapterIO('init', p);
    end
    if k >= 3
      a = 125 * strcmp(seq{k}, 'shift');
      Audapter('setParam', 'pertAmp', a * ones(1, 257)); Audapter('setParam', 'pertPhi', zeros(1, 257));
    end
    PP = {pc, p}; q = exp_trial(PP{1 + (k >= 3)}, X{k});
    r.(arm{1}).shift_s(k) = q.shift_s; r.(arm{1}).on(k) = q.on; r.(arm{1}).off(k) = q.off; r.(arm{1}).dF1mel(k) = q.dF1mel;
    wr(sprintf('%s_t%d_out.wav', arm{1}, k), q.d.signalOut); wr(sprintf('t%d_in.wav', k), q.d.signalIn);
    printf('%s trial %d (%s): shifted %.3f s (%.3f-%.3f), logged dF1 %+.1f mel, output/input F1 %.3f\n', arm{1}, k, seq{k}, q.shift_s, q.on, q.off, q.dF1mel, q.outF1);
  end
  case_mark('');
end

% ---- real voice (primary listening example): the same session with a real sentence on every trial (CMU ARCTIC clb a0030,
% "I had faith in them.", female)
Mc = corpus_index(); xs = corpus_wav(Mc(strcmp({Mc.id}, 'arctic_clb_a0030'))); xs = [xs; 1e-4*randn(round(0.3*fs),1)];
for arm = {'exp', 'obs'}
  Audapter('setParam', 'datapb', w, 1);
  Audapter('ost', MF_OST, 0); Audapter('pcf', MF_PCF, 0); AudapterIO('init', pc);
  for k = 1:numel(seq)
    if k == 3
      if strcmp(arm{1}, 'exp'), Audapter('ost', '', 0); Audapter('pcf', '', 0); end
      AudapterIO('init', p);
    end
    if k >= 3
      a = 125 * strcmp(seq{k}, 'shift'); Audapter('setParam', 'pertAmp', a * ones(1, 257)); Audapter('setParam', 'pertPhi', zeros(1, 257));
    end
    PP = {pc, p}; q = exp_trial(PP{1 + (k >= 3)}, xs);
    r.real.(arm{1}).shift_s(k) = q.shift_s; r.real.(arm{1}).on(k) = q.on; r.real.(arm{1}).off(k) = q.off;
    wr(sprintf('real_%s_t%d_out.wav', arm{1}, k), q.d.signalOut); if k == 1, wr('real_in.wav', q.d.signalIn); end
    printf('real %s trial %d (%s): shifted %.3f s, output/input F1 %.3f\n', arm{1}, k, seq{k}, q.shift_s, q.outF1);
  end
end
Audapter('ost', '', 0); Audapter('pcf', '', 0);
r.real.trial_s = numel(xs) / fs; r.real.clip = 'arctic_clb_a0030';
% second arm: SimOn hold block (bedhead OST, PCF 125 mel in every row), then a field "noShift" trial
pcf = 'cfg/report_coord1_hold.pcf'; fid = fopen(pcf, 'w'); fprintf(fid, '0\n\n9\n'); for s = 0:8, fprintf(fid, '%d, 0.0, 0, 125, 0\n', s); end; fclose(fid);
for cl = [0 1]
  Audapter('ost', [R '/simonSingleWord/experiment scripts/bedheadMaster.ost'], 0); Audapter('pcf', pcf, 0); AudapterIO('init', p);
  q = exp_trial(p, X{3});                                                                  % a hold trial
  if cl, Audapter('ost', '', 0); Audapter('pcf', '', 0); end
  AudapterIO('init', p); Audapter('setParam', 'pertAmp', zeros(1, 257)); Audapter('setParam', 'pertPhi', zeros(1, 257));
  q = exp_trial(p, X{4});
  r.simon.(ifelse_str(cl, 'cleared', 'not_cleared')) = struct('shift_s', q.shift_s, 'dF1mel', q.dF1mel);
  printf('after a SimOn hold block, field noShift trial, clear lines %d: shifted %.3f s, logged dF1 %+.1f mel\n', cl, q.shift_s, q.dF1mel);
end
Audapter('ost', '', 0); Audapter('pcf', '', 0);
r.settings = report_settings(p, 'female', 'ost', fileread(MF_OST), 'pcf', fileread(MF_PCF), ...
  'setparam', struct('pertAmp', '125 (all 257 values) on shift trials, 0 on noShift trials', 'pertPhi', '0 (all 257 values): F1 up', ...
                     'datapb', 'bundled babble mtbabble48k.wav, loaded with free-speech get_noiseSource'), ...
  'sequence', {seq}, 'switching', 'calibration block with measureFormants.ost/.pcf (bShift 0); then AudapterIO(''init'', p) and field-mode pertAmp/pertPhi set before every trial; reset() before every trial. Expected: the runner clears the OST and PCF first; observed: it does not', ...
  'input', sprintf('synthetic "head"-like /E/ vowel, %.2f s, F0 205-212 Hz, formants %s Hz', WD, mat2str(EH)), ...
  'field', struct('f1', 125, 'f2', 0), 'pg_drop', {{'ost', 'pcf'}});
od = report_outdir('coord-1');
report_json(fullfile(od, 'data.json'), r);

