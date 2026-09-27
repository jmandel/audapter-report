% Report asset export for OST-F4 (PCF with fewer rows than the OST has states: Audapter.cpp:1811 and 1841-1842
% index pertCfg.fmtPertAmp/fmtPertPhi with the OST state and no bounds check).
% Scenario: OST states 0-4 (onset, 250 ms window, offset, end); the PCF has 3 rows (states 0-2) because only
% state 2 is perturbed. States 3 and 4 then read past the end of both 3-element float arrays on every frame.
% Figure-only card: run under ASan first (aborts at the first bad read; stderr goes to asan.log), then on the
% normal build, which writes data.json including the ASan lines parsed from asan.log.
% Usage: ./run-oct.sh report_ost_f4.m build-asan > oct/out/report/ost-f4/asan.log 2>&1; ./run-oct.sh report_ost_f4.m
p = defparams('female'); p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0;
fs = p.sr * p.downFact; fr = p.frameLen / p.sr;
fid = fopen('cfg/report_f4.ost', 'w'); fprintf(fid, ['rmsSlopeWin = 0.030000\n\nn = 4\n0 INTENSITY_RISE_HOLD 0.01 0.02 {}\n' ...
  '2 ELAPSED_TIME 0.25 NaN {}\n3 INTENSITY_FALL 0.01 0.02 {}\n4 OST_END NaN NaN {}\n\nn = 0\n']); fclose(fid);
NPCF = 3;
fid = fopen('cfg/report_f4.pcf', 'w'); fprintf(fid, '0\n\n%d\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0.3, 0\n', NPCF); fclose(fid);
randn('seed', 4);
T1 = 1.2; x = 1e-4*randn(round(T1*fs), 1);
v = synth_vowel(fs, 0.8, 200, [760 1150 2500 3500], [80 100 150 200], 'onset', 0, 'offset', 0, 'amp', 0.3);   % /a/ 0.10-0.90 s
x(round(0.1*fs)+(1:numel(v))) += v;
d = run_trial(p, x, 'ost', 'cfg/report_f4.ost', 'pcf', 'cfg/report_f4.pcf');
Audapter('ost', '', 0); Audapter('pcf', '', 0);
if ~isempty(strfind(BUILD, 'asan')), printf('DONE (no sanitizer report)\n'); return; end
first = @(s) (find(d.ost_stat >= s, 1) - 1) * fr;
st = d.ost_stat(:); t = (0:numel(st)-1)' * fr;
r = struct();
r.frame_s = fr; r.pcf_n = NPCF; r.max_state = max(st); r.n_states = max(st) + 1;
r.state_on_s = arrayfun(first, 0:max(st));
r.oob_first_s = first(NPCF); r.oob_frames = nnz(st >= NPCF); r.frames = numel(st);
r.oob_frac = r.oob_frames / r.frames; r.oob_states = unique(st(st >= NPCF))';
r.oob_bytes_max = 4 * (max(st) + 1); r.alloc_bytes = 4 * NPCF;
r.shift_frames_state2 = nnz(st == 2 & d.sfmts(:,1) > 0);
r.shift_frames_oob = nnz(st >= NPCF & d.sfmts(:,1) > 0);
r.vowel_on_s = 0.1; r.vowel_off_s = 0.9;
% ASan lines from the sanitizer run (the first bad read aborts that run)
af = '/h/oct/out/report/ost-f4/asan.log'; r.asan = struct('read', '', 'frame0', '', 'located', '', 'alloc', '', 'summary', '');
if exist(af, 'file')
  L = strsplit(fileread(af), "\n");
  g = @(pat) strtrim(regexprep(L{find(~cellfun(@isempty, regexp(L, pat, 'once')), 1)}, '0x[0-9a-f]+', '0x…'));
  r.asan.read = g('^READ of size'); r.asan.frame0 = regexprep(g('^\s+#0 .*handleBuffer'), '^#0 0x… in ', '');
  r.asan.located = g('is located'); r.asan.alloc = regexprep(g('#1 .*readFromFile'), '^#1 0x… in ', '');
  r.asan.summary = g('^SUMMARY: AddressSanitizer');
end
printf('states 0-%d, PCF rows %d; OOB from %.3f s, %d of %d frames; shifted frames: state 2 %d, OOB %d\n', ...
  r.max_state, NPCF, r.oob_first_s, r.oob_frames, r.frames, r.shift_frames_state2, r.shift_frames_oob);
printf('asan: %s | %s | %s\n', r.asan.summary, r.asan.located, r.asan.alloc);
k = 1:5:numel(st); r.t = round((k-1) * fr * 1e4) / 1e4;
r.stat = st(k)'; r.rms = round(d.rms(k,1)' * 1e4) / 1e4; r.sF1 = round(d.sfmts(k,1))';
r.params = struct('ost', fileread('cfg/report_f4.ost'), 'pcf', fileread('cfg/report_f4.pcf'));
od = report_outdir('ost-f4');
r.settings = report_settings(p, 'female', 'ost', fileread('cfg/report_f4.ost'), 'pcf', fileread('cfg/report_f4.pcf'), 'switching', 'one trial', 'input', 'synthetic vowel');
report_json(fullfile(od, 'data.json'), r);
