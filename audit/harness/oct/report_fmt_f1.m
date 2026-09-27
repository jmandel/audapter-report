% Report asset export for FMT-F1 / I-08 (array setters ignore the MATLAB length: clampf1/clampf2 always copy 2048 values,
% the 1D field arrays 257). Same configuration as t_mem.m SCEN=clamp_short: bShift = 1, bClampFormants = 1,
% clamp_osts = [0 5], clamp_f1 = 700 Hz x 100 frames, clamp_f2 = 1500 Hz x 100 frames (a lab-side trajectory shorter than 2048).
% The same init + trial is repeated 3 times in one session, each after a different-size unrelated allocation, to show that
% what Audapter stores past element 100 (and so what the clamp does) is whatever lies on the heap.
% Usage: ./run-oct.sh report_fmt_f1.m                 (values + trial effects; out/report/fmt-f1/blab/data.json)
%        VARIANT=upstream ./run-oct.sh report_fmt_f1.m build-upstream upstream/audapter_matlab   (1D field arrays only)
%        ./run-oct.sh report_fmt_f1.m build-asan > oct/out/report/fmt-f1/asan/asan.log 2>&1   (ASan: heap-buffer-overflow in setGetParam)
1;
function v = ifelse(c, a, b)
  if c, v = a; else, v = b; end
end
IS_ASAN = ~isempty(strfind(BUILD, 'asan'));
UP = strcmp(getenv('VARIANT'), 'upstream'); pf = '/h/oct/out/report/fmt-f1-params.mat';
if UP, load(pf); else, p = defparams('female'); save('-binary', pf, 'p'); end   % upstream mcode lacks fsic: reuse blab-made params
fs = p.sr * p.downFact; fr = p.frameLen / p.sr; NP = 100;
x = synth_vowel(fs, 0.6, 120, [850 1220 2810 3800], [80 100 150 200]);
q = p; q.bShift = 1; q.bClampFormants = 1; q.clamp_osts = [0 5]; q.clamp_f1 = 700 * ones(1, NP); q.clamp_f2 = 1500 * ones(1, NP);
if UP   % upstream 2.1.5 has no clamp; run only the 1D-field part (I-08: pertF2/pertAmp/pertPhi read 257 values there too)
  q2 = p; q2.bShift = 1; q2.pertF2 = linspace(0, 5000, 10); q2.pertAmp = 0.2 * ones(1, 10); q2.pertPhi = zeros(1, 10);
  if isfield(q2, 'pertF1'), q2 = rmfield(q2, 'pertF1'); end
  AudapterIO('init', q2); a = Audapter('getParam', 'pertamp');
  r = struct('pert_n_passed', 10, 'pert_n_read', numel(a), 'pert_amp_nonzero_beyond', nnz(a(11:end)), 'pert_amp_beyond_min', min(a(11:end)), 'pert_amp_beyond_max', max(a(11:end)));
  r.audio = struct('file', {}, 'label', {}, 'dur_s', {}, 'active_rms_dbfs', {}, 'peak_dbfs', {}, 'warn', {});
  printf('upstream pertamp: read %d, %d nonzero values past element 10\n', r.pert_n_read, r.pert_amp_nonzero_beyond);
  report_json(fullfile(report_outdir('fmt-f1'), 'data.json'), r); return;
end
if IS_ASAN
  printf('ASan run: AudapterIO(''init'') with a %d-element clamp_f1\n', NP);
  AudapterIO('init', q);
  printf('NOT REACHED under ASan\n'); return;
end
rand('seed', 3); r = struct(); r.n_passed = NP; r.n_read = 2048; r.frame_s = fr; r.clamp_hz = 700; r.in_peak = max(abs(x));
% clampIx is a function-static that reset() does not clear (formant F5). A silent trial without the clamp takes the
% "no shift" branch, which sets clampIx = 0, so every case below starts its trajectory at element 0.
flush = @() run_trial(setfield(p, 'bShift', 1), zeros(round(0.02 * fs), 1));
qc = q; qc.clamp_f1 = [700 * ones(1, NP), zeros(1, 2048 - NP)]; qc.clamp_f2 = [1500 * ones(1, NP), zeros(1, 2048 - NP)];
cases = {qc, q, q, q}; names = {'padded to 2048 (control)', 'short, run 1', 'short, run 2', 'short, run 3'};
R = struct('name', {}, 'first_zero', {}, 'n_nonzero_beyond', {}, 'stuck_value', {}, 'n_700', {}, 'n_1500', {}, 'n_tiny', {}, 'n_huge', {}, 'n_other', {}, 'max_sF1', {}, ...
           'sF1_class', {}, 'out_nan', {}, 'out_max', {}, 'first_bad_s', {});
for i = 1:numel(cases)
  junk = rand(1, 37 * i);                                      % unrelated allocation; changes what follows the array on the heap
  flush();
  AudapterIO('init', cases{i});
  c = Audapter('getParam', 'clampf1');
  d = run_trial(cases{i}, x, 'init', false);
  s = d.sfmts(:, 1);
  % 1 = 700 Hz as passed, 2 = 1500 Hz (the clamp_f2 values: the next array on the heap), 3 = below 1 Hz, 4 = above 8 kHz / not finite, 5 = other
  cls = 5 * ones(numel(s), 1); cls(abs(s - 700) < 0.5) = 1; cls(abs(s - 1500) < 0.5) = 2; cls(abs(s) < 1) = 3; cls(abs(s) > 8000 | ~isfinite(s)) = 4;
  e = struct('name', names{i});
  z = find(c(NP+1:end) == 0, 1); e.first_zero = ifelse(isempty(z), -1, z + NP - 1);   % 0-based index of the first zero past the passed values
  e.n_nonzero_beyond = nnz(c(NP+1:end)); e.stuck_value = ifelse(isempty(z), 'none', sprintf('%.3g', c(max(e.first_zero, 1))));
  if i == 1, r.rms_in = round(d.rms(1:5:end, 1)' * 1e4) / 1e4; end
  e.n_700 = nnz(cls == 1); e.n_1500 = nnz(cls == 2); e.n_tiny = nnz(cls == 3); e.n_huge = nnz(cls == 4); e.n_other = nnz(cls == 5);
  e.max_sF1 = max(abs(s(isfinite(s))));
  e.sF1_class = cls(1:5:end)';
  e.out_nan = nnz(~isfinite(d.signalOut)); e.out_max = max(abs(d.signalOut(isfinite(d.signalOut))));
  fb = find(cls ~= 1, 1); e.first_bad_s = ifelse(isempty(fb), -1, (fb - 1) * fr);
  R(i) = e;
  printf('%s: first zero at %d, %d nonzero values in 100..2047; sF1 frames: %d x 700, %d x 1500, %d <1 Hz, %d >8 kHz, %d other (max %.3g); out max %.3g, %d non-finite\n', ...
    e.name, e.first_zero, e.n_nonzero_beyond, e.n_700, e.n_1500, e.n_tiny, e.n_huge, e.n_other, e.max_sF1, e.out_max, e.out_nan);
end
r.cases = R; r.t = round((0:5:numel(s)-1) * fr * 1e4) / 1e4; r.trial_s = numel(s) * fr;
r.vowel_on_s = 0.1; r.vowel_off_s = 0.7;
% 1D field arrays (I-08): 10-element pertF2/pertAmp/pertPhi, Audapter reads 257
q2 = p; q2.bShift = 1; q2.pertF2 = linspace(0, 5000, 10); q2.pertAmp = 0.2 * ones(1, 10); q2.pertPhi = zeros(1, 10); q2.pertF1 = zeros(1, 10);
AudapterIO('init', q2); a = Audapter('getParam', 'pertamp');
r.pert_n_passed = 10; r.pert_n_read = numel(a); r.pert_amp_nonzero_beyond = nnz(a(11:end));
r.pert_amp_beyond_min = min(a(11:end)); r.pert_amp_beyond_max = max(a(11:end));
printf('pertamp: read %d, %d nonzero values past element 10, range [%.3g, %.3g]\n', r.pert_n_read, r.pert_amp_nonzero_beyond, r.pert_amp_beyond_min, r.pert_amp_beyond_max);
od = report_outdir('fmt-f1');
% Heap contents change from process to process (ASLR, allocation history), so each run of this script appends its
% 'short, run 1' outcome to history.json; the card reports the spread over all runs so far.
hf = fullfile(od, 'history.json'); H = [];
if exist(hf, 'file'), H = jsondecode(fileread(hf)); end
h1 = struct('first_zero', R(2).first_zero, 'n_nonzero_beyond', R(2).n_nonzero_beyond, 'out_max', R(2).out_max, 'out_nan', R(2).out_nan, ...
            'max_sF1', R(2).max_sF1, 'n_700', R(2).n_700, 'n_1500', R(2).n_1500, 'n_tiny', R(2).n_tiny, 'n_huge', R(2).n_huge, 'n_other', R(2).n_other);
if isempty(H), H = h1; else, H = [H(:); h1]; end
report_json(hf, H); r.history = H; r.n_runs = numel(H);
r.audio = struct('file', {}, 'label', {}, 'dur_s', {}, 'active_rms_dbfs', {}, 'peak_dbfs', {}, 'warn', {});
report_json(fullfile(od, 'data.json'), r);
