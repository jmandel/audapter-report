% Report asset export for OST-F2 (maxIOI jump writes statOnsetIndices[stat] instead of [j], ost.cpp:727).
% Basis: t_ost.m F2 (OST 0 INTENSITY_RISE_HOLD / 2 ELAPSED_TIME 0.1 / 3 OST_END, maxIOI "0 0.2 2").
% Audible version: a soft sustained vowel that never crosses the onset threshold, so the 0.2 s maxIOI fallback
% must start the sequence; the PCF raises F1 by 30 % in state 3, i.e. from 0.1 s after the fallback onset.
% Runs in ONE MEX session: control (same intended timing as two ELAPSED_TIME rules), then three trials with the
% OST/PCF loaded once and Audapter('reset') between trials (as in an experiment loop), then one trial after reloading.
% Usage: ./run-oct.sh report_ost_f2.m   then   VARIANT=upstream ./run-oct.sh report_ost_f2.m build-upstream upstream/audapter_matlab
% Output: out/report/ost-f2/<build>/{*.wav,data.json}
UP = strcmp(getenv('VARIANT'), 'upstream');
if ~UP, p = defparams('female');
p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0;
p.F1Min = 0; p.F1Max = 5000; p.F2Min = 0; p.F2Max = 5000; p.LBk = 0; p.LBb = 0;
p.pertF1 = linspace(0, 5000, 257); p.pertF2 = p.pertF1; p.pertAmp = zeros(1,257); p.pertPhi = zeros(1,257); end
pf = '/h/oct/out/report/ost-f2-params.mat';
if UP, load(pf); p = rmfield(p, 'pertF1'); else, save('-binary', pf, 'p'); end
fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
ONSET_THR = 0.02; TIMEOUT = 0.2; ELAPSED = 0.1;
fid = fopen('cfg/report_ioi.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD %g 0.02 {}\n2 ELAPSED_TIME %g NaN {}\n3 OST_END NaN NaN {}\n\nn = 1\n0 %g 2\n', ONSET_THR, ELAPSED, TIMEOUT); fclose(fid);
fid = fopen('cfg/report_ioi.pcf', 'w'); fprintf(fid, '0\n\n4\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0, 0\n3, 0, 0, 0.3, 0\n'); fclose(fid);
% Control: the intended timing written without maxIOI (state numbers 0, 1, 2 here = 0, 2, 3 above)
fid = fopen('cfg/report_ioi_ctrl.ost', 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME %g NaN {}\n1 ELAPSED_TIME %g NaN {}\n2 OST_END NaN NaN {}\n\nn = 0\n', TIMEOUT, ELAPSED); fclose(fid);
fid = fopen('cfg/report_ioi_ctrl.pcf', 'w'); fprintf(fid, '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0.3, 0\n'); fclose(fid);
randn('seed', 11);
V_AA = [760 1150 2500 3500]; BW = [80 100 150 200];
T1 = 1.4; x = 1e-4*randn(round(T1*fs), 1);
v = synth_vowel(fs, 1.15, 200, V_AA, BW, 'onset', 0, 'offset', 0, 'amp', 0.035);   % soft /a/, 0.05-1.20 s
x(round(0.05*fs)+(1:numel(v))) = x(round(0.05*fs)+(1:numel(v))) + v;
dC = run_trial(p, x, 'ost', 'cfg/report_ioi_ctrl.ost', 'pcf', 'cfg/report_ioi_ctrl.pcf');
dC.ost_stat(dC.ost_stat >= 1) = dC.ost_stat(dC.ost_stat >= 1) + 1;          % map to the maxIOI OST's numbering
d = cell(1, 3);
d{1} = run_trial(p, x, 'ost', 'cfg/report_ioi.ost', 'pcf', 'cfg/report_ioi.pcf');   % loaded once ...
for k = 2:3, d{k} = run_trial(p, x, 'init', false); end                              % ... then only reset
dR = run_trial(p, x, 'ost', 'cfg/report_ioi.ost', 'pcf', 'cfg/report_ioi.pcf');     % reloaded before the trial
Audapter('ost', '', 0); Audapter('pcf', '', 0);
first = @(d, s) (find(d.ost_stat >= s, 1) - 1) * fr;
shon = @(d) (find(d.sfmts(:,1) > 0, 1) - 1) * fr;
r = struct();
r.frame_s = fr; r.timeout_s = TIMEOUT; r.elapsed_s = ELAPSED; r.onset_thr = ONSET_THR;
r.max_rms = max(d{1}.rms(:,1)); r.rms_thresh = p.rmsThresh;
r.ctrl_state2_s = first(dC, 2); r.ctrl_state3_s = first(dC, 3); r.ctrl_shift_on_s = shon(dC);
r.state2_s = cellfun(@(q) first(q, 2), d); r.state3_s = cellfun(@(q) first(q, 3), d);
r.held_s = r.state3_s - r.state2_s; r.shift_on_s = cellfun(shon, d);
r.reload_state2_s = first(dR, 2); r.reload_state3_s = first(dR, 3); r.reload_shift_on_s = shon(dR);
% F1 heard (independent LPC on the output) in 0.22-0.38 s: shifted in trial 1 already, not yet in the control
w = @(q, a, b) median(est_formants(q(round(a*p.sr):round(b*p.sr)), p.sr)(:,1), 'omitnan');
r.F1_in_hz = w(dC.signalIn, 0.22, 0.38); r.F1_ctrl_early_hz = w(dC.signalOut, 0.22, 0.28); r.F1_t1_early_hz = w(d{1}.signalOut, 0.22, 0.28);
r.F1_ctrl_mid_hz = w(dC.signalOut, 0.42, 0.58); r.F1_t3_mid_hz = w(d{3}.signalOut, 0.42, 0.58);   % trial 3 not yet shifted
printf('max rms %.4f; control: s2 %.3f s3 %.3f shift %.3f\n', r.max_rms, r.ctrl_state2_s, r.ctrl_state3_s, r.ctrl_shift_on_s);
for k = 1:3, printf('trial %d: s2 %.3f s3 %.3f held %.3f shift on %.3f\n', k, r.state2_s(k), r.state3_s(k), r.held_s(k), r.shift_on_s(k)); end
printf('reloaded: s2 %.3f s3 %.3f; F1 heard 0.22-0.28 s: input %.0f ctrl %.0f trial1 %.0f; 0.42-0.58 s: ctrl %.0f trial3 %.0f\n', r.reload_state2_s, r.reload_state3_s, r.F1_in_hz, r.F1_ctrl_early_hz, r.F1_t1_early_hz, r.F1_ctrl_mid_hz, r.F1_t3_mid_hz);
k = 1:5:numel(dC.ost_stat); lg = @(v) round(v(k)' * 1e4) / 1e4;
r.t = round((k-1) * fr * 1e4) / 1e4;
r.rms = lg(d{1}.rms(:,1)); r.stat_ctrl = dC.ost_stat(k)';
r.stat_1 = d{1}.ost_stat(k)'; r.stat_2 = d{2}.ost_stat(k)'; r.stat_3 = d{3}.ost_stat(k)';
r.sF1_ctrl = round(dC.sfmts(k,1))'; r.sF1_1 = round(d{1}.sfmts(k,1))'; r.sF1_2 = round(d{2}.sfmts(k,1))'; r.sF1_3 = round(d{3}.sfmts(k,1))';
od = report_outdir('ost-f2');
c = struct('name', {'input', 'output_control', 'output_trial1', 'output_trial3'}, ...
  'x', {dC.signalIn, dC.signalOut, d{1}.signalOut, d{3}.signalOut}, ...
  'label', {'Input: a soft sustained /a/ that stays below the onset threshold', sprintf('Output: control with the intended timing (F1 +30 %% from %.2f s)', r.ctrl_shift_on_s), ...
            sprintf('Output: trial 1 (F1 +30 %% from %.2f s)', r.shift_on_s(1)), sprintf('Output: trial 3, OST not reloaded (F1 +30 %% from %.2f s)', r.shift_on_s(3))}, ...
  'warn', {'', '', '', ''});
r.audio = report_wavgroup(od, p.sr, c);
r.params = struct('sr', p.sr, 'downFact', p.downFact, 'frameLen', p.frameLen, 'rmsThresh', p.rmsThresh, ...
  'ost', fileread('cfg/report_ioi.ost'), 'pcf', fileread('cfg/report_ioi.pcf'), 'ost_ctrl', fileread('cfg/report_ioi_ctrl.ost'));
audiowrite(fullfile(od, 'dev_vowel_48k.wav'), x, fs, 'BitsPerSample', 16);
if ~UP, r.settings = report_settings(p, 'female', 'ost', fileread('cfg/report_ioi.ost'), 'pcf', fileread('cfg/report_ioi.pcf'), 'sequence', {{'trial 1', 'trial 2', 'trial 3'}}, 'switching', 'OST and PCF loaded once; reset() before every trial', 'input', 'synthetic soft vowel that never reaches the onset threshold'); end
report_json(fullfile(od, 'data.json'), r);
