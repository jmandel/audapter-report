% Report asset export for PT-5 (phase vocoder is not level-preserving; bPvocAmpNorm unreachable).
% A sustained vowel; an OST switches to state 1 at 0.6 s; the PCF asks for 0 st in state 0 and +2 st in
% state 1 (a typical pitch-perturbation-onset design). Controls: bPitchShift = 0 (the level the
% participant should hear) and the pvoc at a constant 0 st. Traces: 20 ms output level re input, F0.
% Usage: ./run-oct.sh report_pt5.m
% Output: out/report/pt-5/blab/{*.wav,data.json}
p = defparams('female'); fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
fid = fopen('cfg/report_step.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 2\n0 ELAPSED_TIME 0.6 NaN {}\n1 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
fid = fopen('cfg/report_step.pcf', 'w'); fprintf(fid, '0\n\n2\n0, 0, 0, 0, 0\n1, 2, 0, 0, 0\n'); fclose(fid);
F0D = 120;   % as in t_pitch.m; the F0/vowel sweep below shows how the step size varies
x = synth_vowel(fs, 1.2, F0D, [850 1220 2810 3800], [80 100 150 200], 'onset', 0.1, 'offset', 0.1, 'amp', 0.25);
case_mark('observed');   % Playground test case capture (audit/playground/capture); no-op otherwise
q = p; q.bPitchShift = 0;                          d0 = run_trial(q, x);
q = p; q.bPitchShift = 1; q.pitchShiftRatio = 1;  d1 = run_trial(q, x);
q = p; q.bPitchShift = 1; q.pitchShiftRatio = 1;  dS = run_trial(q, x, 'ost', 'cfg/report_step.ost', 'pcf', 'cfg/report_step.pcf');
case_mark('');
Audapter('ost', '', 0); Audapter('pcf', '', 0);
% can the documented fix be switched on?
nm = {'bPvocAmpNorm', 'bpvocmpnorm'}; r = struct(); r.ampnorm = struct('name', nm, 'result', {'', ''});
for i = 1:2
  try, Audapter('setParam', lower(nm{i}), 1, 0); r.ampnorm(i).result = 'accepted';
  catch e, r.ampnorm(i).result = e.message; end
end
W = round(0.02 * p.sr); nb = floor(numel(dS.signalIn) / W);
blk = @(s) sqrt(mean(reshape(s(1:nb*W), W, nb).^2));
lin = blk(dS.signalIn); ok = lin > 0.3 * max(lin);
rel = @(d) round(20*log10(blk(d.signalOut) ./ max(blk(d.signalIn), 1e-9)) * 100) / 100;
r.dt = 0.02; r.voiced = double(ok);
r.level_step = rel(dS); r.level_bypass = rel(d0); r.level_pvoc0 = rel(d1);
% Audapter delays the output by a fixed latency; measure it on the bypass run and align the traces
[xc, lags] = xcorr(d0.signalOut, d0.signalIn, 400); [~, im] = max(xc); r.latency_s = lags(im) / p.sr;
% F0 per 40 ms window (hop 20 ms)
F0 = nan(1, nb);
for b = 2:nb-1
  s = dS.signalOut((b-2)*W+1:(b+1)*W);
  if rms(s) > 0.01, F0(b) = est_f0(s, p.sr, 100, 400); end
end
r.f0_out = round(F0 * 10) / 10;
r.ost_onset_s = (find(dS.ost_stat >= 1, 1) - 1) * fr;
m1 = round(0.3/0.02):round(0.55/0.02); m2 = round(0.8/0.02):round(1.15/0.02);
r.gain_before_db = mean(r.level_step(m1)); r.gain_after_db = mean(r.level_step(m2)); r.gain_bypass_db = mean(r.level_bypass(m2));
r.f0_in = est_f0(dS.signalIn, p.sr); r.f0_after = median(F0(m2), 'omitnan');
printf('onset %.3f s; gain before %.2f dB, after %.2f dB, bypass %.2f dB; F0 in %.1f after %.1f (%.1f cents)\n', ...
  r.ost_onset_s, r.gain_before_db, r.gain_after_db, r.gain_bypass_db, r.f0_in, r.f0_after, 1200*log2(r.f0_after/r.f0_in));
printf('ampnorm: %s | %s\n', r.ampnorm(1).result, r.ampnorm(2).result);
% Sweep: steady-state gain at 0 st and +2 st (constant ratio), over F0 and vowel
V = struct('name', {'a', 'i'}, 'F', {[850 1220 2810 3800], [300 2300 3000 3800]}); sw = [];
for iv = 1:2, for f0 = [100 120 150 180 220 260]
  xs = synth_vowel(fs, 0.8, f0, V(iv).F, [80 100 150 200]); g = [];
  for st = [0 2]
    q = p; q.bPitchShift = 1; q.pitchShiftRatio = 2^(st/12); d = run_trial(q, xs); mm = round(0.35*p.sr):round(0.75*p.sr);
    g(end+1) = 20*log10(rms(d.signalOut(mm)) / rms(d.signalIn(mm)));
  end
  sw(end+1,:) = [iv, f0, g]; printf('sweep /%s/ F0 %d: 0 st %+.2f dB, +2 st %+.2f dB, step %.2f dB\n', V(iv).name, f0, g(1), g(2), g(2)-g(1));
end, end
r.sweep = struct('vowel', {V(sw(:,1)).name}, 'f0', num2cell(sw(:,2))', 'gain0_db', num2cell(round(sw(:,3)*100)/100)', 'gain2_db', num2cell(round(sw(:,4)*100)/100)');

% ---- Main example (EXP-11, COORD-4): a time-warp experiment at blab's timeAdapt settings (free-speech
% run_measureDuration_audapter.m: sRate 48000, downFact 2 -> 24 kHz, frameLen 48, bPitchShift = 1 "needed if time warping
% is used"). Perturbed trials carry a PCF time-warp section; control trials either keep a zero-length warp row (the way
% blab's timeWrap experiment does) or drop the warp section. Same real sentence on every trial; PCF reloaded per trial.
% fb 1 so that the speech level can be measured without the babble (the babble is added after the vocoder).
M = corpus_index(); cw = 'arctic_clb_a0018'; xw = corpus_wav(M(strcmp({M.id}, cw))); xw = xw(1:min(end, round(1.75*48000)));
pw = getAudapterDefaultParams('female'); pw.downFact = 2; pw.sr = 24000; pw.frameLen = 48; pw.bPitchShift = 1; pw.fb = 1;
WARP = sprintf('1\n0.40, 0.5, 0.2, 0.0, 2.0\n\n1\n0, 0.0, 0, 0, 0\n');
ZERO = sprintf('1\n0.40, 0.5, 0.0, 0.0, 2.0\n\n1\n0, 0.0, 0, 0, 0\n');
NONE = sprintf('0\n\n1\n0, 0.0, 0, 0, 0\n');
pc = {'warp', WARP; 'zero', ZERO; 'none', NONE};
for i = 1:3, fid = fopen(sprintf('cfg/report_pt5_%s.pcf', pc{i,1}), 'w'); fprintf(fid, '%s', pc{i,2}); fclose(fid); end
md = '/h/oct/out/report/pt-5/meas'; if ~exist(md, 'dir'), mkdir(md); end
if strcmp(getenv('SCEN'), 'timewrap')   % blab's timeWrap / cerebTimeAdapt settings (COORD-9), fresh process, phases in session order
  pt = getAudapterDefaultParams('female'); pt.downFact = 2; pt.sr = 24000; pt.frameLen = 32; pt.nDelay = 3; pt.fb = 1;
  ZW = sprintf('1\n0.40, 0.5, 0.0, 0.0, 2.0\n\n1\n0, 0.0, 0, 0, 0\n'); RW = sprintf('1\n0.40, 0.5, 0.2, 0.0, 2.0\n\n1\n0, 0.0, 0, 0, 0\n');
  fid = fopen('cfg/report_pt5_tw_zero.pcf', 'w'); fprintf(fid, '%s', ZW); fclose(fid);
  fid = fopen('cfg/report_pt5_tw_warp.pcf', 'w'); fprintf(fid, '%s', RW); fclose(fid);
  lv = @(d) 20*log10(rms(d.signalOut(round(0.1*pt.sr):end)) / rms(d.signalIn(round(0.1*pt.sr):end)));
  % click train for latency: 5 clicks, 0.2 s apart, embedded in the same noise floor
  xc = 1e-4*randn(round(1.4*48000), 1); ck = round((0.2:0.2:1.0)*48000); for c = ck, xc(c:c+47) = xc(c:c+47) + 0.5*hanning(48); end
  onset = @(y, sr) arrayfun(@(t) (find(abs(y(round((t-0.01)*sr):round((t+0.1)*sr))) > 0.25*max(abs(y(round((t-0.01)*sr):round((t+0.1)*sr)))), 1) - 1) / sr - 0.01, (0.2:0.2:1.0));
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
  case_mark('tw_pre');   % Playground test case capture (audit/playground/capture); no-op otherwise
  q = pt; q.bPitchShift = 0; AudapterIO('init', q);
  d0 = run_trial(q, xw, 'init', false); c0 = run_trial(q, xc, 'init', false);
  case_mark('tw_later');
  q = pt; q.bPitchShift = 1; AudapterIO('init', q); Audapter('ost', 'cfg/one.ost', 0);
  Audapter('pcf', 'cfg/report_pt5_tw_zero.pcf', 0); d1 = run_trial(q, xw, 'init', false); c1 = run_trial(q, xc, 'init', false);
  Audapter('pcf', 'cfg/report_pt5_tw_warp.pcf', 0); d2 = run_trial(q, xw, 'init', false);
  case_mark('');
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
  audiowrite(fullfile(md, 'tw_in.wav'), d0.signalIn, pt.sr, 'BitsPerSample', 16);
  audiowrite(fullfile(md, 'tw_pre_out.wav'), d0.signalOut, pt.sr, 'BitsPerSample', 16);
  audiowrite(fullfile(md, 'tw_later_out.wav'), d1.signalOut, pt.sr, 'BitsPerSample', 16);
  audiowrite(fullfile(md, 'tw_later_warp_out.wav'), d2.signalOut, pt.sr, 'BitsPerSample', 16);
  o0 = onset(c0.signalOut, pt.sr) - onset(c0.signalIn, pt.sr); o1 = onset(c1.signalOut, pt.sr) - onset(c1.signalIn, pt.sr);
  rt = struct('pre_db', lv(d0), 'later_db', lv(d1), 'later_warp_db', lv(d2), 'lat_pre_ms', 1000*median(o0), 'lat_later_ms', 1000*median(o1), ...
              'lat_pre_all_ms', 1000*o0, 'lat_later_all_ms', 1000*o1);
  printf('timeWrap/cerebTimeAdapt settings: pre %+.2f dB, later (zero-length warp row) %+.2f dB, later (warp trial) %+.2f dB; click latency pre %.1f ms, later %.1f ms\n', ...
         rt.pre_db, rt.later_db, rt.later_warp_db, rt.lat_pre_ms, rt.lat_later_ms);
  rt.settings = report_settings(setfield(pt, 'bPitchShift', 1), 'female', 'pcf', ZW, 'ost', fileread('cfg/one.ost'), ...
     'sequence', {{'pre phase: bPitchShift 0, no PCF', 'later phases: bPitchShift 1 with a warp-row PCF'}}, ...
     'switching', 'pre phase: bPitchShift 0 and no PCF; later phases: bPitchShift 1 and a PCF with a warp row on every trial (zero-length on control trials)', ...
     'input', sprintf('real speech: CMU ARCTIC %s "There was a change now." (female), first %.2f s; clicks (Hann, 1 ms) for latency', cw, numel(xw) / 48000));
  report_json(fullfile(md, 'timewrap.json'), rt); return;
end
if strcmp(getenv('SCEN'), 'cereb')   % fresh process: a warp PCF loaded earlier keeps the vocoder in warp mode even after pcf '' (OST-F5 note)
% ---- A plausible design with the settings of an unused Audapter runner in blab's cerebTypicalProduction folder (the experiment as wired uses Psychtoolbox, no Audapter feedback; COORD-6 correction): 24 kHz, frameLen 32, nDelay 3, no PCF;
% a baseline phase runs bPitchShift 0, later phases bPitchShift 1. Real sentence; fb 1 so the speech level can be measured.
case_mark('cereb');   % Playground test case capture (audit/playground/capture); no-op otherwise
for b = [0 1]
  pc5 = getAudapterDefaultParams('female'); pc5.downFact = 2; pc5.sr = 24000; pc5.frameLen = 32; pc5.nDelay = 3; pc5.bPitchShift = b; pc5.fb = 1;
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
  d = run_trial(pc5, xw);
  audiowrite(fullfile(md, sprintf('cereb_b%d_out.wav', b)), d.signalOut, pc5.sr, 'BitsPerSample', 16);
  if b == 0, audiowrite(fullfile(md, 'cereb_in.wav'), d.signalIn, pc5.sr, 'BitsPerSample', 16); end
  rc.(sprintf('b%d_db', b)) = 20*log10(rms(d.signalOut(round(0.1*pc5.sr):end)) / rms(d.signalIn(round(0.1*pc5.sr):end)));
  if b == 1, PC5 = pc5; end
end
case_mark('');
printf('cerebTypicalProduction settings: bPitchShift 0 %+.2f dB, bPitchShift 1 %+.2f dB re input\n', rc.b0_db, rc.b1_db);
rc.settings = report_settings(PC5, 'female', 'sequence', {{'baseline: bPitchShift 0', 'later phases: bPitchShift 1'}}, ...
  'switching', 'phase change: bPitchShift 0 in the baseline, 1 afterwards; no OST or PCF', ...
  'input', sprintf('real speech: CMU ARCTIC %s "There was a change now." (female), first %.2f s', cw, numel(xw) / 48000));
report_json(fullfile(md, 'cereb.json'), rc); return;
end
seqw = {'control', 'warp', 'control', 'warp'};
for arm = {'exp', 'obs'}
  case_mark(['warp_' arm{1}]);   % Playground test case capture (audit/playground/capture); no-op otherwise
  AudapterIO('init', pw); Audapter('ost', 'cfg/one.ost', 0);
  for k = 1:numel(seqw)
    if strcmp(seqw{k}, 'warp'), f = 'warp'; elseif strcmp(arm{1}, 'exp'), f = 'zero'; else, f = 'none'; end
    Audapter('pcf', sprintf('cfg/report_pt5_%s.pcf', f), 0);
    d = run_trial(pw, xw, 'init', false);
    audiowrite(fullfile(md, sprintf('warp_%s_t%d_out.wav', arm{1}, k)), d.signalOut, pw.sr, 'BitsPerSample', 16);
    if k == 1, audiowrite(fullfile(md, 'warp_in.wav'), d.signalIn, pw.sr, 'BitsPerSample', 16); end
    g = 20*log10(rms(d.signalOut(round(0.1*pw.sr):end)) / rms(d.signalIn(round(0.1*pw.sr):end)));
    printf('warp session %s trial %d (%s, PCF %s): output re input %+.2f dB\n', arm{1}, k, seqw{k}, f, g);
  end
  case_mark('');
end
Audapter('ost', '', 0); Audapter('pcf', '', 0);
% the same comparison at the blab defaults (16 kHz, frameLen 32), numbers only
p16 = getAudapterDefaultParams('female'); p16.bPitchShift = 1; p16.fb = 1; lv16 = struct();
for f = {'none', 'zero', 'warp'}
  AudapterIO('init', p16); Audapter('ost', 'cfg/one.ost', 0); Audapter('pcf', sprintf('cfg/report_pt5_%s.pcf', f{1}), 0);
  d = run_trial(p16, xw, 'init', false);
  lv16.(f{1}) = 20*log10(rms(d.signalOut(round(0.1*p16.sr):end)) / rms(d.signalIn(round(0.1*p16.sr):end)));
end
printf('16 kHz / frameLen 32: no warp section %+.2f dB, zero-length warp row %+.2f dB, warp %+.2f dB\n', lv16.none, lv16.zero, lv16.warp);
Audapter('ost', '', 0); Audapter('pcf', '', 0);
r.warp16 = lv16;
q = pw; q.bPitchShift = 0; d = run_trial(q, xw);            % reference: no vocoder (e.g. the measureFormants calibration)
audiowrite(fullfile(md, 'warp_ref_out.wav'), d.signalOut, pw.sr, 'BitsPerSample', 16);

r.cereb = jsondecode(fileread(fullfile(md, 'cereb.json')));
r.timewrap = jsondecode(fileread(fullfile(md, 'timewrap.json')));   % from SCEN=timewrap (fresh process)   % from SCEN=cereb (fresh process)
r.warp = struct('clip', cw, 'dur_s', numel(xw) / 48000, 'sequence', {seqw}, 'sr', pw.sr);
r.settings = report_settings(pw, 'female', 'ost', fileread('cfg/one.ost'), 'pcf', WARP, 'pcf_control', ZERO, ...
  'sequence', {seqw}, 'switching', 'PCF reloaded before every trial (the warp PCF on perturbed trials; on control trials either a zero-length warp row or no warp section); reset() before every trial', ...
  'input', sprintf('real speech: CMU ARCTIC %s "There was a change now." (female), first %.2f s', cw, numel(xw) / 48000));
od = report_outdir('pt-5');
c = struct('name', {'input_vowel', 'output_bypass', 'output_pitch_step'}, ...
  'x', {dS.signalIn, d0.signalOut, dS.signalOut}, ...
  'label', {sprintf('Input: sustained /a/, F0 %d Hz', F0D), 'Output with bPitchShift = 0 (reference level)', 'Output with the 0 to +2 st PCF step at 0.6 s'}, ...
  'warn', {'', '', ''});
r.audio = report_wavgroup(od, p.sr, c);
% device-rate (48 kHz) unscaled input for the in-browser panel (templates/panels/pt-5.js)
audiowrite(fullfile(od, 'dev_vowel_48k.wav'), x, fs, 'BitsPerSample', 16);
report_json(fullfile(od, 'data.json'), r);
