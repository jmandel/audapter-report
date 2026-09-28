% Level cues from perturbations (REPORT-34): (1) CORPUS-7 clips for the loudness model (bus noise and noisy speech through the
% phase vocoder at 0 st vs off); (2) does a formant shift itself change the output level? Typical blab perturbations on real
% speech, with bGainAdapt 0 (as every blab runner sends it) and 1 (the C++ default); (3) gain-adaptation state across trials.
% Level = RMS of the output over the perturbed span (frames logged as shifted, output read one processing delay later),
% shifted run vs unshifted run of the same input and settings.
% Usage: ./run-oct.sh report_loudcues.m    Output: out/report/corpus-7/meas/*.wav, out/report/loudcues/{data.json,*.wav}
addpath('/a/other/blab-experiments/free-speech/experiment_helpers', '-end');
FS = '/a/other/blab-experiments/free-speech'; addpath(fullfile(FS, 'utils'), '-end'); addpath(fullfile(FS, 'speech'), '-end'); addpath('/h/oct/exp_shims');
M = corpus_index(); fs = 48000;
% ---- (1) CORPUS-7 pairs
md7 = '/h/oct/out/report/corpus-7/meas'; if ~exist(md7, 'dir'), mkdir(md7); end
m = M(strcmp({M.id}, 'vbd_p257_387_bus2.5')); x = corpus_wav(m);
[c, ~] = audioread('/a/audit/corpus/gt/vbd_p257_387.clean.wav'); c = c(:,1) * (rms(x) / rms(audioread(m.file)(:,1)));
for b = [0 1]
  p0 = defparams('female'); p0.bPitchShift = b; p0.rmsThresh = 0;
  d = run_trial(p0, x - c); audiowrite(fullfile(md7, sprintf('noise_b%d.wav', b)), d.signalOut, p0.sr, 'BitsPerSample', 16);
  d = run_trial(p0, x);     audiowrite(fullfile(md7, sprintf('noisy_b%d.wav', b)), d.signalOut, p0.sr, 'BitsPerSample', 16);
end
% ---- (2) formant shifts and level
od = '/h/oct/out/report/loudcues'; if ~exist(od, 'dir'), mkdir(od); end
ids = {'arctic_bdl_a0005', 'M'; 'arctic_rms_a0018', 'M'; 'arctic_clb_a0030', 'F'; 'arctic_slt_a0036', 'F'; ...
       'pvqd_LA9015_a', 'M'; 'pvqd_LA9015_i', 'M'; 'pvqd_SJ7001_a', 'F'; 'pvqd_SJ7001_i', 'F'};
pert = {'F1 +125 mel', 0, 1, 125, 0; 'F1 -125 mel', 0, 1, 125, pi; 'F1 +20 %', 1, 0, 0.2, 0; 'F1 -20 %', 1, 0, 0.2, pi};
fm = struct('iy', [342 2322], 'uw', [378 997], 'ae', [588 1952], 'aa', [768 1333]); pf = calc_pertField('in', fm, 1, 0);
R = struct('clip', {}, 'sex', {}, 'pert', {}, 'gainadapt', {}, 'level_db', {}, 'shift_s', {});
hz2mel = @(f) 1127.01048 * log(1 + f / 700);
for i = 1:size(ids, 1)
  mm = M(strcmp({M.id}, ids{i,1})); x = corpus_wav(mm); x = x(1:min(end, round(2.0*fs)));
  g = ifelse_str(ids{i,2} == 'M', 'male', 'female');
  npert = size(pert, 1) + (ids{i,2} == 'M');   % the 2-D centralization field (male default means) on male voices only
  for ga = [0 1]
    base = getAudapterDefaultParams(g); base.gainAdapt = ga; base.fb = 1; base.bShift = 1;
    Audapter('ost', '', 0); Audapter('pcf', '', 0);
    q = base; q.bRatioShift = 0; q.bMelShift = 1; AudapterIO('init', q);
    Audapter('setParam', 'pertAmp', zeros(1, 257)); Audapter('setParam', 'pertPhi', zeros(1, 257)); d0 = exp_trial(q, x);
    for k = 1:npert
      if k <= size(pert, 1)
        q = base; q.bRatioShift = pert{k,2}; q.bMelShift = pert{k,3}; AudapterIO('init', q);
        Audapter('setParam', 'pertAmp', pert{k,4} * ones(1, 257)); Audapter('setParam', 'pertPhi', pert{k,5} * ones(1, 257)); nm = pert{k,1};
      else
        q = add2struct(base, pf); q.bRatioShift = 0; q.bMelShift = 1; q.bShift2D = 1; q.pertAmp2D = 0.5 * pf.pertAmp2D; AudapterIO('init', q);
        Audapter(3, 'pertf1', q.pertF1); Audapter(3, 'pertf2', q.pertF2); Audapter(3, 'pertAmp2D', q.pertAmp2D); Audapter(3, 'pertPhi2D', q.pertPhi2D);
        nm = '2-D centralization, strength 0.5';
      end
      d1 = exp_trial(q, x);
      s = d1.d.sfmts(:,1) > 0 & abs(d1.d.sfmts(:,1) - d1.d.fmts(:,1)) > 1; lag = q.nDelay;   % frames
      N = q.frameLen; idx = [];
      for f = find(s)', a = (f - 1 + lag) * N + 1; idx = [idx, a:min(a + N - 1, numel(d1.d.signalOut))]; end
      if isempty(idx), L = NaN; else, L = 20*log10(rms(d1.d.signalOut(idx)) / rms(d0.d.signalOut(idx))); end
      R(end+1) = struct('clip', ids{i,1}, 'sex', ids{i,2}, 'pert', nm, 'gainadapt', ga, 'level_db', L, 'shift_s', d1.shift_s);
      printf('%s (%s) %-32s bGainAdapt %d: shifted %.2f s, level %+.2f dB re unshifted\n', ids{i,1}, ids{i,2}, nm, ga, d1.shift_s, L);
      if any(strcmp(ids{i,1}, {'arctic_bdl_a0005', 'arctic_clb_a0030'}))
        tg = sprintf('%s_%s_g%d', strrep(ids{i,1}, 'arctic_', ''), regexprep(strrep(strrep(nm, '+', 'up'), '-', 'down'), '[^A-Za-z0-9]+', ''), ga);
        audiowrite(fullfile(od, [tg '.wav']), d1.d.signalOut, q.sr, 'BitsPerSample', 16);
        audiowrite(fullfile(od, sprintf('%s_unshifted_g%d.wav', strrep(ids{i,1}, 'arctic_', ''), ga)), d0.d.signalOut, q.sr, 'BitsPerSample', 16);
      end
    end
  end
end
% ---- (3) gain-adaptation state across trials: trial 1 ends while shifted (F1 -20 %), trial 2 unshifted; compare trial 2's
% output with the same trial in a fresh session (first 20 ms and whole trial)
q = getAudapterDefaultParams('female'); q.gainAdapt = 1; q.fb = 1; q.bShift = 1; q.bRatioShift = 1; q.bMelShift = 0;
mm = M(strcmp({M.id}, 'pvqd_SJ7001_a')); xa = corpus_wav(mm); xa = xa(round(0.3*fs):round(1.3*fs));    % stops mid-vowel
xb = [1e-4*randn(round(0.1*fs),1); xa(1:round(0.6*fs)); 1e-4*randn(round(0.3*fs),1)];
AudapterIO('init', q); Audapter('setParam', 'pertAmp', zeros(1, 257)); Audapter('setParam', 'pertPhi', zeros(1, 257)); fresh = exp_trial(q, xb);
Audapter('setParam', 'pertAmp', 0.2 * ones(1, 257)); Audapter('setParam', 'pertPhi', pi * ones(1, 257)); exp_trial(q, xa);
Audapter('setParam', 'pertAmp', zeros(1, 257)); after = exp_trial(q, xb);
dd = after.d.signalOut - fresh.d.signalOut; n20 = round(0.02 * q.sr);
G.max_abs_diff = max(abs(dd)); G.first_diff_s = (find(abs(dd) > 1e-9, 1) - 1) / q.sr; if isempty(G.first_diff_s), G.first_diff_s = NaN; end
G.n_diff = nnz(abs(dd) > 1e-9); G.rel_db = 20*log10(max(abs(dd)) / max(abs(fresh.d.signalOut)) + 1e-12);
printf('gainAdapt state: trial after a shifted trial vs fresh: %d samples differ, first at %.4f s, max |diff| %.2g (%.1f dB re peak)\n', G.n_diff, G.first_diff_s, G.max_abs_diff, G.rel_db);
report_json(fullfile(od, 'data.json'), struct('rows', R, 'gainstate', G));
q = getAudapterDefaultParams('male'); q.fb = 1; q.bShift = 1; q.bRatioShift = 0; q.bMelShift = 1;
S = report_settings(q, 'male', 'setparam', struct('pertAmp', '125 (all 257 values)', 'pertPhi', '0 (F1 up) or pi (F1 down)'), ...
  'sequence', {{'unshifted', 'F1 +125 mel', 'F1 -125 mel', 'F1 +20 % (bRatioShift 1)', 'F1 -20 % (bRatioShift 1)', '2-D centralization 0.5 (male voices)'}}, ...
  'switching', 'each perturbation on the same input; bGainAdapt 0 (getAudapterDefaultParams, sent by AudapterIO) and 1', ...
  'input', 'real speech: CMU ARCTIC bdl a0005, rms a0018 (male), clb a0030, slt a0036 (female); PVQD LA9015 (male) and SJ7001 (female) sustained /a/ and /i/');
report_json(fullfile(report_outdir('fmt-level'), 'data.json'), struct('rows', R, 'gainstate', G, 'settings', S));
