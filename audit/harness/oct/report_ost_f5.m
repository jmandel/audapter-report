% Report asset export for OST-F5 (a PCF pitch shift overwrites p.pitchShiftRatio, which stays shifted after the PCF is
% cleared), in a mixed pitch design with catch trials (FINDINGS-LOG EXP-8, exp_mixed.m S4b). A plausible design, not one
% blab runs: sustained-vowel pitch-perturbation trials (+2 semitones from the detected voice onset until the level falls,
% phase vocoder), where phonation continues until the trial is stopped, so a perturbed trial ends while shifted.
% Catch trials: observed = made by clearing the PCF, Audapter('pcf', '', 0); expected = made by loading an all-zero PCF
% (the safe pattern; also what AudapterIO('init', p) before every trial gives, as blab's pitch experiments do).
% Usage: ./run-oct.sh report_ost_f5.m      Output: out/report/ost-f5/blab/data.json, out/report/ost-f5/meas/*.wav
p = getAudapterDefaultParams('female'); p.downFact = 3; p.sr = 16000; p.frameLen = 32;
p.bShift = 0; p.bPitchShift = 1; p.fb = 1;
fs = p.sr * p.downFact; EH = [731 2058 2979 4000]; BW = [80 100 150 200]; randn('seed', 5);
G1 = 0.3; VP = 1.2; VC = 0.8; TAIL = 0.4;
xp = [1e-4*randn(round(G1*fs),1); synth_vowel(fs, VP, 200, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0)];   % stops mid-vowel
xc = [1e-4*randn(round(G1*fs),1); synth_vowel(fs, VC, 200, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); 1e-4*randn(round(TAIL*fs),1)];
OST = sprintf('rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n');
UP = sprintf('0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 2.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n');
ZERO = sprintf('0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n');
fid = fopen('cfg/report_ostf5.ost', 'w'); fprintf(fid, '%s', OST); fclose(fid);
fid = fopen('cfg/report_ostf5_up.pcf', 'w'); fprintf(fid, '%s', UP); fclose(fid);
fid = fopen('cfg/report_ostf5_zero.pcf', 'w'); fprintf(fid, '%s', ZERO); fclose(fid);
seq = {'shift', 'catch', 'shift', 'catch'}; X = {xp, xc, xp, xc};
md = '/h/oct/out/report/ost-f5/meas'; if ~exist(md, 'dir'), mkdir(md); end
f0i = est_f0(xc(1:3:end), p.sr);
r = struct('g1', G1, 'vp', VP, 'vc', VC, 'sequence', {seq}, 'trial_s', cellfun(@(x) numel(x) / fs, X), 'f0_in', f0i);
for arm = {'exp', 'obs'}
  case_mark(arm{1});                                                                       % Playground test case capture
  AudapterIO('init', p); Audapter('ost', 'cfg/report_ostf5.ost', 0);
  for k = 1:numel(seq)
    if strcmp(seq{k}, 'shift'), Audapter('pcf', 'cfg/report_ostf5_up.pcf', 0);
    elseif strcmp(arm{1}, 'exp'), Audapter('pcf', 'cfg/report_ostf5_zero.pcf', 0);
    else, Audapter('pcf', '', 0); end
    q = exp_trial(p, X{k});
    o = q.d.ost_stat(:); fr = p.frameLen / p.sr;
    on = find(o == 2, 1); ofs = find(o >= 3, 1);
    r.(arm{1}).st2_on(k) = min([(on - 1) * fr, NaN]); r.(arm{1}).st3(k) = min([(ofs - 1) * fr, NaN]);
    r.(arm{1}).ratio_logged(k) = q.d.params.pitchShiftRatio;
    c = 1200 * log2(est_f0(q.d.signalOut, p.sr) / f0i); r.(arm{1}).cents(k) = c;
    audiowrite(fullfile(md, sprintf('%s_t%d_out.wav', arm{1}, k)), q.d.signalOut / 1.5, p.sr, 'BitsPerSample', 16);
    audiowrite(fullfile(md, sprintf('t%d_in.wav', k)), q.d.signalIn / 1.5, p.sr, 'BitsPerSample', 16);
    printf('%s trial %d (%s): state 2 from %.3f s, state 3 at %.3f s, output F0 %+.0f cents, logged params.pitchShiftRatio %.4f\n', ...
           arm{1}, k, seq{k}, r.(arm{1}).st2_on(k), r.(arm{1}).st3(k), c, r.(arm{1}).ratio_logged(k));
  end
  case_mark('');
end

% ---- real voice (primary): PVQD SJ7001 sustained /a/ (female, CC BY 4.0); shift trials stop mid-phonation
Mc = corpus_index(); ra = corpus_wav(Mc(strcmp({Mc.id}, 'pvqd_SJ7001_a')), 0.06); rp = ra(round(0.3*fs) + (1:round(VP*fs)));
rc = ra(round(0.3*fs) + (1:round(VC*fs))); rmp = linspace(0, 1, round(0.02*fs))'; rp(1:numel(rmp)) = rp(1:numel(rmp)) .* rmp;
rc(1:numel(rmp)) = rc(1:numel(rmp)) .* rmp; rc(end-numel(rmp)+1:end) = rc(end-numel(rmp)+1:end) .* flipud(rmp);
XR = {[1e-4*randn(round(G1*fs),1); rp], [1e-4*randn(round(G1*fs),1); rc; 1e-4*randn(round(TAIL*fs),1)]};
XR = XR([1 2 1 2]); f0r = est_f0(XR{2}(1:3:end), p.sr); r.real.f0_in = f0r;
for arm = {'exp', 'obs'}
  case_mark(['real_' arm{1}]);   % Playground test case capture; no-op otherwise
  AudapterIO('init', p); Audapter('ost', 'cfg/report_ostf5.ost', 0);
  for k = 1:numel(seq)
    if strcmp(seq{k}, 'shift'), Audapter('pcf', 'cfg/report_ostf5_up.pcf', 0);
    elseif strcmp(arm{1}, 'exp'), Audapter('pcf', 'cfg/report_ostf5_zero.pcf', 0);
    else, Audapter('pcf', '', 0); end
    q = exp_trial(p, XR{k}); o = q.d.ost_stat(:); fr = p.frameLen / p.sr; on = find(o == 2, 1);
    r.real.(arm{1}).st2_on(k) = min([(on - 1) * fr, NaN]); r.real.(arm{1}).ratio_logged(k) = q.d.params.pitchShiftRatio;
    audiowrite(fullfile(md, sprintf('real_%s_t%d_out.wav', arm{1}, k)), q.d.signalOut / 1.5, p.sr, 'BitsPerSample', 16);
    audiowrite(fullfile(md, sprintf('real_t%d_in.wav', k)), q.d.signalIn / 1.5, p.sr, 'BitsPerSample', 16);
    printf('real %s trial %d (%s): state 2 from %.3f s, output F0 %+.0f cents\n', arm{1}, k, seq{k}, r.real.(arm{1}).st2_on(k), 1200*log2(est_f0(q.d.signalOut, p.sr) / f0r));
  end
  case_mark('');
end
r.real.trial_s = cellfun(@(x) numel(x) / fs, XR); r.real.clip = 'pvqd_SJ7001_a';
% the same with AudapterIO('init', p) before every trial and catch trials made by clearing the PCF (blab's pitch experiments re-init)
AudapterIO('init', p); Audapter('ost', 'cfg/report_ostf5.ost', 0);
for k = 1:numel(seq)
  AudapterIO('init', p);
  if strcmp(seq{k}, 'shift'), Audapter('pcf', 'cfg/report_ostf5_up.pcf', 0); else, Audapter('pcf', '', 0); end
  q = exp_trial(p, X{k}); r.reinit_cents(k) = 1200 * log2(est_f0(q.d.signalOut, p.sr) / f0i);
end
printf('init before every trial, catch by clearing the PCF: %s cents\n', mat2str(round(r.reinit_cents)));
Audapter('ost', '', 0); Audapter('pcf', '', 0);
r.settings = report_settings(p, 'female', 'ost', OST, 'pcf', UP, 'pcf_catch', ZERO, 'sequence', {seq}, ...
  'switching', 'OST loaded once; before every trial the +2 st PCF is loaded on shift trials; on catch trials the expected session loads an all-zero PCF and the observed session clears the PCF with Audapter(''pcf'', '''', 0); reset() before every trial', ...
  'input', sprintf('synthetic sustained /ae/-like vowel, F0 %.0f Hz; shift trials %.1f s of phonation still going when the trial stops, catch trials %.1f s', f0i, VP, VC));
od = report_outdir('ost-f5');
report_json(fullfile(od, 'data.json'), r);
