% CORPUS: re-run the report's main findings on REAL speech clips from audit/corpus (all redistributable).
% Exports per finding: out/report/<id>/real/{*.wav,data.json}. WAVs are signalIn/signalOut at p.sr (16 kHz),
% written with one shared gain per group (report_wavgroup), so relative levels are preserved.
%   ./run-oct.sh corpus_report.m                         (blab build; all findings)
%   SCEN=pt-5 ./run-oct.sh corpus_report.m               (one finding)
%   VARIANT=upstream ./run-oct.sh corpus_report.m build-upstream upstream/audapter_matlab   (F6 upstream half only)
M = corpus_index(); UP = strcmp(getenv('VARIANT'), 'upstream'); ONLY = getenv('SCEN');
EX = '/a/blab/audapter_matlab/example_data/';
1;
function m = clip(M, id), m = M(strcmp({M.id}, id)); end
function t = st_time(d, p, k), i = find(d.ost_stat >= k, 1); if isempty(i), t = NaN; else, t = (i - 0.5) * p.frameLen / p.sr; end, end
function od = rdir(id), od = fullfile('/h/oct/out/report', id, 'real'); if ~exist(od, 'dir'), mkdir(od); end, end
function v = r4(v), v = round(v * 1e4) / 1e4; end
function e = lvl(s, a, b, sr), s = s(max(1, round(a*sr)):min(numel(s), round(b*sr))); e = 20*log10(max(rms(s), 1e-9)); end
function s = ifelse_s(u), if u, s = 'upstream'; else, s = 'blab'; end, end
function p = ifelse_p(m, PM, PFe), if m.sex == 'M' && ~strcmp(m.group, 'child'), p = PM; else, p = PFe; end, end
function w = wavc(name, x, label), w = struct('name', name, 'x', x(:), 'label', label, 'warn', ''); end
want = @(id) isempty(ONLY) || strcmp(ONLY, id);
PF = '/h/oct/out/report/corpus_report_params.mat';
if ~UP
  PM = defparams('male'); PFe = defparams('female'); save('-binary', PF, 'PM', 'PFe');
else
  load(PF);
end
pp = @(m) ifelse_p(m, PM, PFe);

%% ---------------------------------------------------------------- OST-F1: cross-trial state leak
if want('ost-f1') && ~UP
  Audapter('ost', '', 0); Audapter('pcf', '', 0);   % each section starts clean: a loaded OST/PCF persists across init (COORD-1)
  od = rdir('ost-f1');
  F = '/h/oct/out/corpus_rep_fall.ost'; fid = fopen(F, 'w');
  fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
  P = '/h/oct/out/corpus_rep_s1f1.pcf'; fid = fopen(P, 'w'); fprintf(fid, '0\n\n3\n0, 0, 0, 0, 0\n1, 0, 0, 0.3, 0\n2, 0, 0, 0, 0\n'); fclose(fid);
  pairs = {'arctic_awb_a0030', 'libri_84-121123-0000'; 'arctic_bdl_a0005', 'libri_1988-24833-0010'; 'arctic_bdl_a0018', 'libri_8297-275154-0022';
           'arctic_clb_a0036', 'arctic_bdl_a0030'; 'pvqd_SJ2009_a', 'so762_0111_163'; 'vocalset_f2_long_straight_a', 'libri_2803-154320-0006'};
  R = struct('trialA', {}, 'trialB', {}, 'fall_fresh_s', {}, 'fall_afterA_s', {}, 'shifted_s_fresh', {}, 'shifted_s_afterA', {}, 'speech_end_B_s', {});
  for k = 1:size(pairs, 1)
    a = clip(M, pairs{k,1}); b = clip(M, pairs{k,2}); xa = corpus_wav(a); xb = corpus_wav(b);
    p = pp(b); p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0; p.F1Min = 0; p.F1Max = 5000; p.F2Min = 0; p.F2Max = 5000; p.LBk = 0; p.LBb = 0;
    p.pertAmp = zeros(1,257); p.pertPhi = zeros(1,257); pa = p;
    run_trial(p, zeros(48000, 1), 'ost', F, 'pcf', P);                          % neutral first trial
    d0 = run_trial(p, xb, 'ost', F, 'pcf', P);                                  % B fresh
    dA = run_trial(pa, [xa; zeros(round(0.3*48000), 1)], 'ost', F, 'pcf', P);    % A
    d1 = run_trial(p, xb, 'ost', F, 'pcf', P);                                  % B after A
    E = corpus_csv([b.root '/ref/' b.id '.energy.csv']); fr = p.frameLen / p.sr;
    R(end+1) = struct('trialA', a.id, 'trialB', b.id, 'fall_fresh_s', st_time(d0, p, 2), 'fall_afterA_s', st_time(d1, p, 2), ...
      'shifted_s_fresh', nnz(d0.sfmts(:,1) > 0) * fr, 'shifted_s_afterA', nnz(d1.sfmts(:,1) > 0) * fr, 'speech_end_B_s', E(end, 2));
    printf('OST-F1 %s after %s: fall %.3f -> %.3f s; F1+30%% applied for %.3f -> %.3f s (speech ends %.2f s)\n', b.id, a.id, R(end).fall_fresh_s, R(end).fall_afterA_s, R(end).shifted_s_fresh, R(end).shifted_s_afterA, E(end,2));
    if k == 2   % pair 2: the clearest real-speech case (perturbation applied only after trial A)
      aud = report_wavgroup(od, p.sr, [wavc('trialB_input', d0.signalIn, ['Trial B input: ' b.content]), wavc('trialB_output_fresh', d0.signalOut, 'Trial B output, fresh session'), ...
        wavc('trialB_output_after_A', d1.signalOut, 'Trial B output right after trial A'), wavc('trialA_input', dA.signalIn, ['Trial A input: ' a.content])]);
      kk = 1:5:numel(d1.ost_stat); tr = struct('t', r4((kk-1) * fr), 'stat_B_fresh', d0.ost_stat(kk)', 'stat_B_afterA', d1.ost_stat(kk)', ...
        'sF1_B_fresh', round(d0.sfmts(kk,1))', 'sF1_B_afterA', round(d1.sfmts(kk,1))', 'F1_B', round(d1.fmts(kk,1))', 'rms_B', r4(d1.rms(kk,1))');
    end
  end
  % example_data 'ost' (RISE_HOLD -> FALL -> ELAPSED): no leak expected; from corpus_ost.m
  ex = struct('note', 'example_data/ost, OST not reloaded: state times identical in 6/6 real trial pairs (corpus_ost.m Part B)');
  report_json(fullfile(od, 'data.json'), struct('finding', 'OST-F1', 'ost', fileread(F), 'pcf', fileread(P), 'pairs', R, 'example_ost', ex, 'traces_pair2', tr, 'audio', aud, ...
    'clips_license', 'see audit/corpus/manifest.csv (CMU ARCTIC licence / CC BY 4.0)'));
end

%% ---------------------------------------------------------------- OST-F2: maxIOI drift without reload
if want('ost-f2') && ~UP
  Audapter('ost', '', 0); Audapter('pcf', '', 0);   % each section starts clean: a loaded OST/PCF persists across init (COORD-1)
  od = rdir('ost-f2');
  F = '/h/oct/out/corpus_rep_ioi.ost'; fid = fopen(F, 'w');
  fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 ELAPSED_TIME 0.1 NaN {}\n3 OST_END NaN NaN {}\n\nn = 1\n0 0.2 2\n'); fclose(fid);
  ids = {'arctic_bdl_a0005', 'arctic_slt_a0018', 'libri_2078-142845-0026', 'arctic_rms_a0036', 'so762_0003_0'};
  R = struct('trial', {}, 'clip', {}, 'mode', {}, 'state2_s', {}, 'state3_s', {}, 'held_s', {}, 'speech_onset_s', {});
  for mode = {'reload', 'no_reload'}
    for k = 1:numel(ids)
      m = clip(M, ids{k}); x = corpus_wav(m, 0.01);   % quiet speaker: onset rule (0.02) is slow, so the 0.2 s timeout matters
      p = pp(m);
      if strcmp(mode{1}, 'reload') || k == 1, d = run_trial(p, x, 'ost', F); else, d = run_trial(p, x); end
      E = corpus_csv([m.root '/ref/' m.id '.energy.csv']);
      R(end+1) = struct('trial', k, 'clip', m.id, 'mode', mode{1}, 'state2_s', st_time(d, p, 2), 'state3_s', st_time(d, p, 3), ...
        'held_s', st_time(d, p, 3) - st_time(d, p, 2), 'speech_onset_s', E(1,1));
      printf('OST-F2 %-9s trial %d %-24s state2 %.3f state3 %.3f (held %.3f s, expected 0.100); speech onset %.2f\n', mode{1}, k, m.id, R(end).state2_s, R(end).state3_s, R(end).held_s, E(1,1));
      if k == 2 && strcmp(mode{1}, 'no_reload'), dk = d; end
    end
  end
  aud = report_wavgroup(od, p.sr, [wavc('trial2_input', dk.signalIn, 'Trial 2 input (quiet speaker)')]);
  report_json(fullfile(od, 'data.json'), struct('finding', 'OST-F2', 'ost', fileread(F), 'input_active_rms', 0.01, 'trials', R, 'audio', aud));
  Audapter('ost', '', 0);
end

%% ---------------------------------------------------------------- PT-5: pvoc loudness offset and step
if want('pt-5') && ~UP
  Audapter('ost', '', 0); Audapter('pcf', '', 0);   % each section starts clean: a loaded OST/PCF persists across init (COORD-1)
  od = rdir('pt-5');
  % (a) steady gains 0 / +2 / -2 st per clip, from corpus_shift.csv (run corpus_shift.m first)
  G = struct();
  if exist('/h/oct/out/corpus_shift.csv', 'file')
    fid = fopen('/h/oct/out/corpus_shift.csv'); fgetl(fid); L = {}; while true, l = fgetl(fid); if ~ischar(l), break; end, L{end+1} = l; end; fclose(fid);
    rows = cellfun(@(l) strsplit(l, ',', 'CollapseDelimiters', false), L, 'UniformOutput', false);
    ids = unique(cellfun(@(c) c{1}, rows, 'UniformOutput', false));
    tab = struct('id', {}, 'group', {}, 'g0', {}, 'gp2', {}, 'gm2', {});
    for i = 1:numel(ids)
      r = rows(cellfun(@(c) strcmp(c{1}, ids{i}), rows)); g = nan(1, 3); cs = {'pvoc+0', 'pvoc+2', 'pvoc-2'};
      for j = 1:3, q = r(cellfun(@(c) strcmp(c{3}, cs{j}), r)); if ~isempty(q), g(j) = str2double(q{1}{14}); end, end
      tab(end+1) = struct('id', ids{i}, 'group', r{1}{2}, 'g0', g(1), 'gp2', g(2), 'gm2', g(3));
    end
    clean = ~strncmp({tab.id}, 'vbd_', 4); s2 = [tab.gp2] - [tab.g0]; sm2 = [tab.gm2] - [tab.g0];
    G = struct('n_clips', nnz(clean), 'gain0_db_median', median([tab(clean).g0]), 'gain0_db_range', [min([tab(clean).g0]) max([tab(clean).g0])], ...
      'step_0_to_up2_db_median', median(s2(clean)), 'step_0_to_up2_db_range', [min(s2(clean)) max(s2(clean))], ...
      'step_0_to_down2_db_median', median(sm2(clean)), 'step_0_to_down2_db_range', [min(sm2(clean)) max(sm2(clean))], 'per_clip', tab);
    for g = unique({tab(clean).group})
      i = clean & strcmp({tab.group}, g{1});
      printf('PT-5 %-14s n=%2d  0 st %+.2f dB | step 0->+2 median %+.2f [%+.2f..%+.2f] | 0->-2 %+.2f [%+.2f..%+.2f]\n', g{1}, nnz(i), median([tab(i).g0]), ...
        median(s2(i)), min(s2(i)), max(s2(i)), median(sm2(i)), min(sm2(i)), max(sm2(i)));
      G.by_group.(g{1}) = struct('n', nnz(i), 'step_up2_median', median(s2(i)), 'step_up2_range', [min(s2(i)) max(s2(i))], 'step_down2_median', median(sm2(i)), 'step_down2_range', [min(s2(i)) max(s2(i))]);
    end
    ni = ~clean; printf('PT-5 noisy clips (vbd): 0 st gain %+.2f..%+.2f dB (noise-dominated; see CORPUS pvoc low-frequency boost)\n', min([tab(ni).g0]), max([tab(ni).g0]));
    G.noisy_gain0_db_range = [min([tab(ni).g0]) max([tab(ni).g0])];
  end
  % (b) the step as heard inside one utterance: example ost + pitch_pert.pcf (+2 st in state 4); output level
  %     change across the state-4 onset minus the input level change (100 ms each side)
  ids = {'arctic_bdl_a0005', 'arctic_rms_a0018', 'arctic_slt_a0005', 'arctic_clb_a0018', 'libri_2078-142845-0026', 'libri_84-121123-0000', 'so762_0003_0', 'so762_0049_64', 'blab_trial_1_2'};
  S = struct('clip', {}, 'group', {}, 't_state4_s', {}, 'out_step_db', {}, 'in_step_db', {}, 'heard_step_db', {});
  for k = 1:numel(ids)
    m = clip(M, ids{k}); x = corpus_wav(m); p = pp(m); p.bPitchShift = 1;
    d = run_trial(p, x, 'ost', [EX 'ost'], 'pcf', [EX 'pitch_pert.pcf']);
    L = corpus_lag(d.signalIn, d.signalOut, p.sr); so = [d.signalOut(L+1:end); zeros(L, 1)];
    t4 = st_time(d, p, 4); if isnan(t4), continue; end
    t5 = st_time(d, p, 5); if isnan(t5), t5 = t4 + 0.48; end
    oi = lvl(d.signalIn, t4 + 0.02, t5, p.sr) - lvl(d.signalIn, t4 - 0.2, t4, p.sr); oo = lvl(so, t4 + 0.02, t5, p.sr) - lvl(so, t4 - 0.2, t4, p.sr);
    S(end+1) = struct('clip', m.id, 'group', m.group, 't_state4_s', t4, 'out_step_db', oo, 'in_step_db', oi, 'heard_step_db', oo - oi);
    printf('PT-5 in-utterance %-24s state4 %.2f s: heard level step at +2 st onset %+.2f dB\n', m.id, t4, oo - oi);
    if k == 1, dx = d; end
  end
  aud = report_wavgroup(od, p.sr, [wavc('pcf_pitch_input', dx.signalIn, 'Input (ARCTIC bdl, "Will we ever forget it.")'), wavc('pcf_pitch_output', dx.signalOut, 'Output: +2 st from the end of word 1 (example ost + pitch_pert.pcf)')]);
  report_json(fullfile(od, 'data.json'), struct('finding', 'PT-5', 'steady', G, 'in_utterance', S, 'audio', aud, ...
    'note', 'gain = output/input RMS over supra-threshold frames; in-utterance step = (output level change) - (input level change) across the state-4 onset'));
end

%% ---------------------------------------------------------------- formant shifting (real vowels): audio + numbers
if want('fmt-shift') && ~UP
  Audapter('ost', '', 0); Audapter('pcf', '', 0);   % each section starts clean: a loaded OST/PCF persists across init (COORD-1)
  od = rdir('fmt-shift'); ids = {'pvqd_LA9015_a', 'pvqd_SJ2001_i', 'arctic_slt_a0030', 'so762_0049_64'}; W = [];
  for k = 1:numel(ids)
    m = clip(M, ids{k}); x = corpus_wav(m); p = pp(m); g = linspace(0, 5000, 257);
    p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0; p.F1Min = 0; p.F1Max = 5000; p.F2Min = 0; p.F2Max = 5000; p.LBk = 0; p.LBb = 0;
    p.pertF2 = g; p.pertAmp = 0.2*ones(1,257); p.pertPhi = zeros(1,257); d = run_trial(p, x);
    W = [W, wavc([m.id '_input'], d.signalIn, [m.id ' input']), wavc([m.id '_F1up20_output'], d.signalOut, [m.id ' output, F1 +20 %'])];
  end
  aud = report_wavgroup(od, p.sr, W);
  report_json(fullfile(od, 'data.json'), struct('finding', 'formant shifting', 'audio', aud, 'numbers', ...
    'see harness/logs/corpus_shift.log (commanded vs logged vs measured, 78 clips) and corpus_track.log; Hillenbrand numbers are from restricted data: NOT FOR PUBLICATION as audio, numbers only'));
end

%% ---------------------------------------------------------------- F6: dropout fix on real multi-syllable speech
if want('f6')
  Audapter('ost', '', 0); Audapter('pcf', '', 0);   % each section starts clean: a loaded OST/PCF persists across init (COORD-1)
  od = rdir('f6'); ids = {'arctic_bdl_a0030', 'arctic_slt_a0005', 'praat_hid', 'libri_2078-142845-0026'};
  R = struct('clip', {}, 'shifted_frames', {}, 'first_s', {}, 'last_s', {}, 'segments', {});
  W = [];
  for k = 1:numel(ids)
    m = clip(M, ids{k}); x = corpus_wav(m); p = pp(m); g = linspace(0, 5000, 257);
    p.bShift = 1; p.bRatioShift = 1; p.bMelShift = 0; p.pertF2 = g; p.pertAmp = 0.2*ones(1,257); p.pertPhi = zeros(1,257);
    p.F1Min = 350; p.F1Max = 900; p.F2Min = 900; p.F2Max = 2600; p.LBk = 0; p.LBb = 0;
    d = run_trial(p, x); fr = p.frameLen / p.sr; s = d.sfmts(:,1) > 0; e = diff([0; s; 0]);
    seg = [find(e == 1) - 1, find(e == -1) - 1] * fr;
    R(end+1) = struct('clip', m.id, 'shifted_frames', nnz(s), 'first_s', seg(1,1), 'last_s', seg(end,2), 'segments', r4(seg));
    printf('F6 %s %-24s shifted %.3f s in %d segments (%.2f-%.2f s)\n', ifelse_s(UP), m.id, nnz(s)*fr, size(seg,1), seg(1,1), seg(end,2));
    if k == 1, W = [wavc([ifelse_s(UP) '_input'], d.signalIn, 'Input: "I had faith in them." (ARCTIC bdl)'), wavc([ifelse_s(UP) '_output'], d.signalOut, [ifelse_s(UP) ' output, F1 +20 % inside F1 350-900 / F2 900-2600'])]; end
  end
  aud = report_wavgroup(od, p.sr, W);
  S = struct();
  if exist('/h/oct/out/corpus_diff_blab.mat', 'file') && exist('/h/oct/out/corpus_diff_upstream.mat', 'file')
    A = load('/h/oct/out/corpus_diff_upstream.mat'); B = load('/h/oct/out/corpus_diff_blab.mat'); K = fieldnames(B.R); K = K(~cellfun(@isempty, regexp(K, '__field_region$')));
    na = cellfun(@(k) A.R.(k).nshift, K); nb = cellfun(@(k) B.R.(k).nshift, K); nt = cellfun(@(k) B.R.(k).ntrack, K);
    S = struct('clips', numel(K), 'clips_differing', nnz(na ~= nb), 'shifted_frames_upstream', sum(na), 'shifted_frames_blab', sum(nb), 'tracked_frames', sum(nt));
  end
  report_json(fullfile(od, [ifelse_s(UP) '_data.json']), struct('finding', 'F6', 'build', ifelse_s(UP), 'field', 'F1 350-900, F2 900-2600 Hz, F1 +20 %', 'clips', R, 'corpus_sweep', S, 'audio', aud));
end

%% ---------------------------------------------------------------- I-01: masking-noise gap with real speech input
if want('i-01') && ~UP
  Audapter('ost', '', 0); Audapter('pcf', '', 0);   % each section starts clean: a loaded OST/PCF persists across init (COORD-1)
  od = rdir('i-01'); p = PFe; fs = 48000; N = p.frameLen * p.downFact;
  [mb, fsm] = audioread('/a/blab/audapter_matlab/mcode/mtbabble48k.wav'); mb = mb - mean(mb); mb = mb / rms(mb); noise5 = mb(1:5*fsm);
  x = []; for id = {'arctic_bdl_a0005', 'arctic_slt_a0018', 'libri_84-121123-0000', 'arctic_rms_a0036', 'so762_0003_0', 'libri_2078-142845-0026'}
    x = [x; corpus_wav(clip(M, id{1})); zeros(round(0.2*fs), 1)]; end
  x = [x; x]; x = x(1:round(12*fs));
  q = p; q.fb = 3; q.fb3Gain = 0.05; q.fb2Gain = 0.05; q.dScale = 1; AudapterIO('init', q); Audapter('setParam', 'datapb', noise5, 0); Audapter('reset');
  for k = 1:floor(numel(x)/N), fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr); end
  d3 = AudapterIO('getData'); res = d3.signalOut - d3.signalIn * 0;   % output = voice path + noise
  % voice-alone reference run (fb 1) to isolate the noise component: noise = out(fb3) - out(fb1)
  d1 = run_trial(p, x); nz = d3.signalOut(1:min(end, numel(d1.signalOut))) - d1.signalOut(1:min(end, numel(d3.signalOut)));
  Wn = round(0.1 * p.sr); nb = floor(numel(nz)/Wn); env = 20*log10(max(sqrt(mean(reshape(nz(1:nb*Wn), Wn, nb).^2)), 1e-9));
  t = ((1:nb) - 0.5) * 0.1; off = env < max(env) - 40;
  printf('I-01 real speech input: noise absent in %.1f s of 12 s (first silent 100 ms block at %.1f s, last at %.1f s)\n', nnz(off)*0.1, t(find(off,1)), t(find(off,1,'last')));
  aud = report_wavgroup(od, p.sr, [wavc('input', d3.signalIn, 'Input: real sentences'), wavc('output_fb3', d3.signalOut, 'Output fb 3 (voice + 5 s masking noise)')]);
  report_json(fullfile(od, 'data.json'), struct('finding', 'I-01', 'noise_absent_s', nnz(off)*0.1, 'noise_gap_start_s', t(find(off,1)), 'noise_gap_end_s', t(find(off,1,'last')), ...
    'noise_env_db_100ms', round(env*10)/10, 'audio', aud, 'note', 'noise component = output(fb 3) - output(fb 1); independent of the voice input, as expected'));
end

%% ---------------------------------------------------------------- OST-F8: AND_RATIO hold on real fricative onsets
if want('ost-f8') && ~UP
  Audapter('ost', '', 0); Audapter('pcf', '', 0);   % each section starts clean: a loaded OST/PCF persists across init (COORD-1)
  od = rdir('ost-f8'); RMS_THR = 0.01; RATIO_THR = 1.5;
  ost = @(f5) sprintf('rmsSlopeWin = 0.030000\n\nn = 2\n0 INTENSITY_AND_RATIO_ABOVE_THRESH %g %g %s\n2 OST_END NaN NaN {}\n\nn = 0\n', RMS_THR, RATIO_THR, f5);
  FH = '/h/oct/out/corpus_rep_ar_hold.ost'; FB = '/h/oct/out/corpus_rep_ar_braces.ost';
  fid = fopen(FH, 'w'); fprintf(fid, '%s', ost('0.05')); fclose(fid); fid = fopen(FB, 'w'); fprintf(fid, '%s', ost('{}')); fclose(fid);
  ids = {'arctic_bdl_a0036', 'arctic_clb_a0036', 'arctic_rms_a0036', 'arctic_slt_a0036', 'libri_1988-24833-0010', 'vbd_p232_234_psquare2.5'};
  R = struct('clip', {}, 'fricative_onset_s', {}, 'state2_hold50ms_s', {}, 'state2_braces_s', {});
  for k = 1:numel(ids)
    m = clip(M, ids{k}); x = corpus_wav(m); p = pp(m);
    dH = run_trial(p, x, 'ost', FH); dB = run_trial(p, x, 'ost', FB);
    fo = NaN; if strcmp(m.source, 'arctic'), P = corpus_phones([m.root '/' strtok(m.gt_file, ';')]); fo = P.t0(find(strcmp(P.ph, 'sh'), 1)); end
    R(end+1) = struct('clip', m.id, 'fricative_onset_s', fo, 'state2_hold50ms_s', st_time(dH, p, 2), 'state2_braces_s', st_time(dB, p, 2));
    printf('OST-F8 %-24s /sh/ onset %.3f | hold 0.05: %.3f s | {}: %.3f s (difference %.0f ms)\n', m.id, fo, R(end).state2_hold50ms_s, R(end).state2_braces_s, 1000*(R(end).state2_hold50ms_s - R(end).state2_braces_s));
  end
  Audapter('ost', '', 0);
  report_json(fullfile(od, 'data.json'), struct('finding', 'OST-F8', 'ost_hold', fileread(FH), 'ost_braces', fileread(FB), 'clips', R));
end

%% ---------------------------------------------------------------- I-02: fb 5 speech/playback mix with real speech
if want('i-02') && ~UP
  Audapter('ost', '', 0); Audapter('pcf', '', 0);   % each section starts clean: a loaded OST/PCF persists across init (COORD-1)
  od = rdir('i-02'); p = PFe; fs = 48000; N = p.frameLen * p.downFact;
  clg0 = calcClosedLoopGain(); DS = [1, 10.^(([15 21] - clg0) / 20)];
  [mb, fsm] = audioread('/a/blab/audapter_matlab/mcode/mtbabble48k.wav'); mb = mb - mean(mb); mb = mb / rms(mb); pb = 0.03 * mb(1:round(4.5*fsm));
  x = [corpus_wav(clip(M, 'arctic_slt_a0018')); zeros(round(0.3*fs), 1); corpus_wav(clip(M, 'libri_84-121123-0000'))]; x = x(1:min(end, round(4*fs)));
  R = struct('dScale', {}, 'speech_component_db', {}, 'playback_component_db', {}, 'speech_minus_playback_db', {});
  for ds = DS
    y = cell(1, 2);
    for gp = [1 0]
      q = p; q.fb = 5; q.dScale = ds; q.fb5GainDB_speech = 20; q.fb5Gain_playback = gp;
      AudapterIO('init', q); Audapter('setParam', 'datapb', pb, 0); Audapter('reset'); yy = zeros(size(x));
      for k = 1:floor(numel(x)/N), fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr); yy((k-1)*N+1:k*N) = fr; end
      y{gp+1} = yy;
    end
    sp = y{1}; pbk = y{2} - y{1};
    act = abs(x) > 0; ls = 20*log10(rms(sp)); lp = 20*log10(rms(pbk));
    R(end+1) = struct('dScale', ds, 'speech_component_db', ls, 'playback_component_db', lp, 'speech_minus_playback_db', ls - lp);
    printf('I-02 dScale %.3f: speech-modulated %.1f dB, playback %.1f dB, difference %.1f dB\n', ds, ls, lp, ls - lp);
  end
  report_json(fullfile(od, 'data.json'), struct('finding', 'I-02', 'dScale_conditions', R, 'note', 'device-rate output read back from runFrame (I-04); speech-modulated = output with fb5Gain_playback 0'));
end
printf('corpus_report done\n');
