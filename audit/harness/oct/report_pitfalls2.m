% Report exports for the "pitfalls for future designs" pass (REPORT-35). Generic, plausible designs; real speech first.
% SCEN selects one part (each runs in a fresh process): ostnum | patch | pbdscale | tdsonset | warp48 | pvocnoise | reinit |
% persist | warpabort. Output: out/report/<card>/blab/data.json and out/report/<card>/meas/*.wav
% Usage: for s in ostnum patch pbdscale tdsonset warp48 pvocnoise reinit persist warpabort; do SCEN=$s ./run-oct.sh report_pitfalls2.m; done
randn('seed', 7); rand('seed', 7);
sc = getenv('SCEN'); M = corpus_index(); fs = 48000; hz2mel = @(f) 1127.01048 * log(1 + f / 700); mel2hz = @(m) (exp(m / 1127.01048) - 1) * 700;
mdir = @report_p2_dir;
wr = @(f, y, sr) audiowrite(f, y / 2, sr, 'BitsPerSample', 16);   % one fixed scale for every clip, so levels stay comparable
cut = @(id, a, b) report_p2_cut(M, id, a, b);
switch sc
% ------------------------------------------------------------------------------------------------ OST rule numbering
case 'ostnum'
  md = mdir('ost-num'); p = getAudapterDefaultParams('female'); p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1; p.fb = 1;
  v = cut('pvqd_SJ7001_a', 0.5, 0.85); rmp = linspace(0,1,round(0.02*fs))'; v(1:numel(rmp)) = v(1:numel(rmp)).*rmp; v(end-numel(rmp)+1:end) = v(end-numel(rmp)+1:end).*flipud(rmp);
  x = [1e-4*randn(round(0.2*fs),1); v; 1e-4*randn(round(0.5*fs),1)]; vend = 0.2 + numel(v)/fs;
  delays = [0.10 0.15 0.20]; r = struct('delays', delays, 'v_on', 0.2, 'v_off', vend, 'trial_s', numel(x)/fs);
  OK = 'rmsSlopeWin = 0.030000\n\nn = 4\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 ELAPSED_TIME %g NaN {}\n3 ELAPSED_TIME 0.2 NaN {}\n4 OST_END NaN NaN {}\n\nn = 0\n';
  BAD = 'rmsSlopeWin = 0.030000\n\nn = 4\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 ELAPSED_TIME %g NaN {}\n4 ELAPSED_TIME 0.2 NaN {}\n6 OST_END NaN NaN {}\n\nn = 0\n';
  PCF_OK = sprintf('0\n\n5\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0, 0\n3, 0, 0, 125, 0\n4, 0, 0, 0, 0\n');
  PCF_BAD = sprintf('0\n\n7\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0, 0\n3, 0, 0, 0, 0\n4, 0, 0, 125, 0\n5, 0, 0, 125, 0\n6, 0, 0, 0, 0\n');
  fid = fopen('cfg/rp2_ok.pcf','w'); fprintf(fid, '%s', PCF_OK); fclose(fid); fid = fopen('cfg/rp2_bad.pcf','w'); fprintf(fid, '%s', PCF_BAD); fclose(fid);
  for k = 1:3
    for arm = {'exp', 'obs'}
      f = ifelse_str(strcmp(arm{1}, 'exp'), OK, BAD); fid = fopen('cfg/rp2.ost','w'); fprintf(fid, f, delays(k)); fclose(fid);
      AudapterIO('init', p); Audapter('setParam', 'pertAmp', zeros(1,257)); Audapter('setParam', 'pertPhi', zeros(1,257));
      Audapter('ost', 'cfg/rp2.ost', 0); Audapter('pcf', ifelse_str(strcmp(arm{1}, 'exp'), 'cfg/rp2_ok.pcf', 'cfg/rp2_bad.pcf'), 0);
      fr = p.frameLen / p.sr; q = exp_trial(p, x); on2 = (find(q.d.ost_stat >= 2, 1) - 1) * fr;
      st = q.d.ost_stat(:); r.(arm{1}).shiftstate_s(k) = nnz(st >= report_p2_ifn(strcmp(arm{1}, 'exp'), 3, 4) & st <= report_p2_ifn(strcmp(arm{1}, 'exp'), 3, 5)) * fr;
      r.(arm{1}).on(k) = q.on; r.(arm{1}).off(k) = q.off; r.(arm{1}).detect(k) = on2; r.(arm{1}).shift_s(k) = q.shift_s;
      wr(fullfile(md, sprintf('%s_t%d.wav', arm{1}, k)), q.d.signalOut, p.sr); if k == 1 && strcmp(arm{1}, 'exp'), wr(fullfile(md, 'in.wav'), q.d.signalIn, p.sr); end
      printf('ostnum trial %d delay %.2f %s: onset detected %.3f, shift %.3f-%.3f s (%.3f s), vowel ends %.3f\n', k, delays(k), arm{1}, on2, q.on, q.off, q.shift_s, vend);
    end
  end
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
  fid = fopen('cfg/rp2.ost','w'); fprintf(fid, BAD, 0.15); fclose(fid); r.ost_bad = fileread('cfg/rp2.ost'); fid = fopen('cfg/rp2.ost','w'); fprintf(fid, OK, 0.15); fclose(fid); r.ost_ok = fileread('cfg/rp2.ost');
  r.settings = report_settings(p, 'female', 'ost', r.ost_bad, 'ost_safe', r.ost_ok, 'pcf', PCF_BAD, 'pcf_catch', PCF_OK, 'sequence', {{'delay 0.10 s', 'delay 0.15 s', 'delay 0.20 s'}}, ...
     'switching', 'the delay row is rewritten before every trial (a random 100-200 ms delay after the detected onset); reset() per trial', ...
     'input', 'real voice: PVQD SJ7001 sustained /a/ cut to a 0.35 s vowel (CC BY 4.0)');
  report_json(fullfile(report_outdir('ost-num'), 'data.json'), r);
% ------------------------------------------------------------------------------------------------ 2-D patch without its bounds
case 'patch'
  md = mdir('fmt-patch'); p = getAudapterDefaultParams('male'); p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1; p.fb = 1;
  c = [hz2mel(580) hz2mel(1800)]; ext = [90 90]; G = 257;
  g1 = linspace(c(1)-ext(1), c(1)+ext(1), G); g2 = linspace(c(2)-ext(2), c(2)+ext(2), G);
  [F1g, F2g] = ndgrid(g1 + (g1(2)-g1(1))/2, g2 + (g2(2)-g2(1))/2); d1 = c(1) - F1g; d2 = c(2) - F2g;
  A = 0.5 * hypot(d1, d2); P = atan2(d2, d1);                    % move each token half-way toward the vowel centre
  tok = [0 0; 40 -50; -60 40; 150 -40; -130 170];                 % mel offsets from the centre: three inside, two outside the patch
  r = struct('centre_mel', c, 'ext_mel', ext, 'tokens', tok);
  for arm = {'exp', 'obs'}
    AudapterIO('init', p);
    Audapter('setParam', 'bshift2d', 1); Audapter('setParam', 'pertf1', g1); Audapter('setParam', 'pertf2', g2);
    Audapter('setParam', 'pertamp2d', A(:)'); Audapter('setParam', 'pertphi2d', P(:)'); Audapter('setParam', 'pertAmp', zeros(1,257)); Audapter('setParam', 'pertPhi', zeros(1,257));
    if strcmp(arm{1}, 'exp')   % the patch's own bounds sent with it
      Audapter('setParam', 'f1min', g1(1)); Audapter('setParam', 'f1max', g1(end)); Audapter('setParam', 'f2min', g2(1)); Audapter('setParam', 'f2max', g2(end));
    end
    for k = 1:size(tok, 1)
      F = mel2hz(c + tok(k,:)); x = synth_vowel(fs, 0.45, 120, [F 2600 3500], [60 90 150 200], 'onset', 0.2, 'offset', 0.2, 'amp', 0.3);
      d = run_trial(p, x, 'init', false); ix = find(d.fmts(:,1) > 0); ix = ix(round(end*0.3):round(end*0.7));
      Pm = [median(hz2mel(d.fmts(ix,1))) median(hz2mel(d.fmts(ix,2)))]; sh = d.sfmts(ix,:); sh(sh(:,1) == 0, :) = d.fmts(ix(sh(:,1) == 0), 1:2);
      H = [median(hz2mel(sh(:,1))) median(hz2mel(sh(:,2)))];
      r.(arm{1})(k) = struct('prod_mel', Pm, 'heard_mel', H, 'intended_mel', Pm + 0.5 * (c - Pm) .* all(abs(Pm - c) <= ext), 'prod_hz', mel2hz(Pm), 'heard_hz', mel2hz(H));
      wr(fullfile(md, sprintf('%s_tok%d.wav', arm{1}, k)), d.signalOut, p.sr); if strcmp(arm{1}, 'exp'), wr(fullfile(md, sprintf('in_tok%d.wav', k)), d.signalIn, p.sr); end
      printf('patch %s token %d (offset %+d/%+d mel): heard shift %+.0f/%+.0f mel\n', arm{1}, k, tok(k,:), H - Pm);
    end
  end
  r.settings = report_settings(p, 'male', 'setparam', struct('bShift2D', 1, 'pertf1', sprintf('mel grid %.0f..%.0f (257 values)', g1(1), g1(end)), 'pertf2', sprintf('mel grid %.0f..%.0f', g2(1), g2(end)), ...
     'pertAmp2D', 'half the distance to the /E/ centre (mel)', 'pertPhi2D', 'toward the centre', 'F1Min..F2Max', 'expected: the patch bounds; observed: not sent (0..5000 defaults)'), ...
     'switching', 'one trial per token', 'input', 'synthetic male /E/ tokens (F0 120 Hz) at the vowel centre and at mel offsets inside and outside a +-90 mel patch');
  report_json(fullfile(report_outdir('fmt-patch'), 'data.json'), r);
% ------------------------------------------------------------------------------------------------ playWave ignores dScale
case 'pbdscale'
  md = mdir('pb-dscale'); p = getAudapterDefaultParams('female'); p.fb = 1; x = cut('arctic_clb_a0030', 0, 1.7);
  AudapterIO('init', p); Audapter('reset'); N = p.frameLen * p.downFact; x = [x; zeros(mod(-numel(x), N), 1)]; y = zeros(size(x));
  for k = 1:numel(x)/N, fr = x((k-1)*N+1:k*N) + 0; Audapter('runFrame', fr); y((k-1)*N+1:k*N) = fr; end   % runFrame writes the device output into its input (I-04)
  lag = 5 * p.frameLen * p.downFact; live = 20*log10(rms(y(lag+1:end)) / rms(x(1:end-lag)));
  r = struct('dScale', p.dScale, 'live_db', live, 'pb_db', 0, 'diff_db', -live, 'expected_diff_db', -20*log10(p.dScale));
  wr(fullfile(md, 'live.wav'), y, fs); wr(fullfile(md, 'playback.wav'), x, fs);
  printf('pbdscale: dScale %.4f, live feedback device output %+.2f dB re input; playWave plays the stored samples unscaled (0 dB): difference %+.2f dB\n', p.dScale, live, -live);
  r.settings = report_settings(p, 'female', 'switching', 'speak trial: live feedback (fb 1); listen trial: Audapter(''playWave'') of the recording', 'input', 'real speech: CMU ARCTIC clb a0030 (female)');
  report_json(fullfile(report_outdir('pb-dscale'), 'data.json'), r);
% ------------------------------------------------------------------------------------------------ TDS schedule clock
case 'tdsonset'
  md = mdir('tds-onset'); ids = {'arctic_bdl_a0005', 'arctic_clb_a0030', 'arctic_slt_a0018', 'arctic_rms_a0036', 'pvqd_SJ7001_a', 'pvqd_LA9015_a'};
  r = struct('rows', struct('clip', {}, 'acoustic_on', {}, 'clock_on', {}, 'lag_ms', {}, 'shift_on', {}));
  for i = 1:numel(ids)
    m = M(strcmp({M.id}, ids{i})); x = corpus_wav(m); x = x(1:min(end, round(2.0*fs)));
    if m.id(1) == 'p', x = [1e-4*randn(round(0.3*fs),1); x(round(0.3*fs):end)]; x(round(0.3*fs)+(1:round(0.15*fs))) = x(round(0.3*fs)+(1:round(0.15*fs))) .* linspace(0,1,round(0.15*fs))'; end   % a soft 150 ms onset
    g = ifelse_str(m.sex == 'M', 'male', 'female'); p = getAudapterDefaultParams(g); p.fb = 1; p.frameLen = 64; p.nDelay = 7;
    p.bTimeDomainShift = 1; p.bCepsLift = 1; p.pitchLowerBoundHz = report_p2_ifn(m.sex == 'M', 70, 140); p.pitchUpperBoundHz = report_p2_ifn(m.sex == 'M', 200, 320);
    p.timeDomainPitchShiftSchedule = [0, 1; 0.2, 1; 0.201, 2^(2/12); 5, 2^(2/12)];   % +2 st from 0.2 s "after onset"
    d = run_trial(p, x); fr = p.frameLen / p.sr;
    e = 20*log10(sqrt(movmean(d.signalIn.^2, round(0.01*p.sr))) + 1e-12); aon = (find(e > max(e) - 40, 1) - 1) / p.sr;   % acoustic onset: within 40 dB of the peak
    con = (find(d.rms(:,1) > p.rmsThresh, 1) - 1) * fr;                                                                    % first above-threshold frame (the schedule's zero)
    % where the output pitch actually steps: output/input F0 ratio > 1.06 in 40 ms windows
    W = round(0.08*p.sr); H = round(0.01*p.sr); son = NaN; lagn = p.nDelay * p.frameLen; q = [];
    for t0 = 1:H:numel(d.signalIn)-W-lagn
      fi = est_f0(d.signalIn(t0:t0+W-1), p.sr); fo = est_f0(d.signalOut(t0+lagn:t0+lagn+W-1), p.sr); q(end+1) = fo / fi;
    end
    k = find(movmin(q, [0 2]) > 1.08, 1); if ~isempty(k), son = (k - 1) * H / p.sr + W / p.sr; end   % end of the first window that is shifted
    r.rows(end+1) = struct('clip', ids{i}, 'acoustic_on', aon, 'clock_on', con, 'lag_ms', 1000*(con - aon), 'shift_on', son);
    printf('tdsonset %s: acoustic onset %.3f s, first above-threshold frame %.3f s (+%.0f ms), pitch step heard at %.3f s (intended %.3f)\n', ids{i}, aon, con, 1000*(con-aon), son, aon + 0.2);
    if i <= 2, wr(fullfile(md, sprintf('%s_out.wav', ids{i})), d.signalOut, p.sr); wr(fullfile(md, sprintf('%s_in.wav', ids{i})), d.signalIn, p.sr); end
  end
  r.settings = report_settings(p, g, 'switching', 'one trial per clip', 'input', 'real speech: CMU ARCTIC bdl a0005, clb a0030, slt a0018, rms a0036; PVQD SJ7001, LA9015 /a/ with a soft 150 ms onset');
  report_json(fullfile(report_outdir('tds-onset'), 'data.json'), r);
% ------------------------------------------------------------------------------------------------ warp magnitude at frameLen 48
case 'warp48'
  md = mdir('warp-48'); T = 1.6; t = (0:round(T*fs)-1)'/fs; f0 = 300; kk = 600; xs = 0.1 * sin(2*pi*(f0*t + kk/2*t.^2));   % a 300 -> 1260 Hz sweep
  PCF = sprintf('1\n0.30, 0.5, 0.12, 0.30, 2.0\n\n1\n0, 0.0, 0, 0, 0\n'); fid = fopen('cfg/rp2_warp.pcf','w'); fprintf(fid, '%s', PCF); fclose(fid);
  r = struct('programmed_ms', 1000 * 0.12 * (1 - 0.5), 'method', 'sweep: output frequency at time t equals the input frequency at t - lag; lag from the spectral peak of 20 ms windows');
  for fl = [32 48]
    for w = [0 1]
      p = getAudapterDefaultParams('female'); p.downFact = 2; p.sr = 24000; p.frameLen = fl; p.nDelay = 3; p.bPitchShift = 1; p.fb = 1; p.rmsThresh = 0;
      AudapterIO('init', p); Audapter('ost', 'cfg/one.ost', 0); if w, Audapter('pcf', 'cfg/rp2_warp.pcf', 0); else, Audapter('pcf', '', 0); end
      d = run_trial(p, xs, 'init', false); y = d.signalOut; sr = p.sr; W = round(0.02*sr); tt = []; lg = [];
      for c = 0.1:0.02:1.4
        sg = y(round(c*sr):round(c*sr)+W-1) .* hanning(W); NF = 2^16; S = abs(fft(sg, NF)); [~, i] = max(S(1:NF/2)); fo = (i-1)*sr/NF;
        tt(end+1) = c + W/2/sr; lg(end+1) = tt(end) - (fo - f0) / kk;
      end
      r.(sprintf('fl%d_w%d', fl, w)) = struct('t', tt, 'lag_ms', 1000*lg, 'pre_ms', 1000*median(lg(tt > 0.15 & tt < 0.28)), 'hold_ms', 1000*median(lg(tt > 0.48 & tt < 0.70)));
    end
    e = r.(sprintf('fl%d_w1', fl)); r.(sprintf('fl%d', fl)) = struct('lag_ms', e.hold_ms - e.pre_ms);
    printf('warp48 frameLen %d: delivered extra lag during the hold %.1f ms of %.1f programmed (%.0f %%)\n', fl, e.hold_ms - e.pre_ms, r.programmed_ms, 100*(e.hold_ms - e.pre_ms)/r.programmed_ms);
  end
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
  x = cut('arctic_clb_a0018', 0, 1.75);
  for fl = [32 48]
    p = getAudapterDefaultParams('female'); p.downFact = 2; p.sr = 24000; p.frameLen = fl; p.nDelay = 3; p.bPitchShift = 1; p.fb = 1;
    AudapterIO('init', p); Audapter('ost', 'cfg/one.ost', 0); Audapter('pcf', 'cfg/rp2_warp.pcf', 0); d = run_trial(p, x, 'init', false);
    wr(fullfile(md, sprintf('speech_fl%d.wav', fl)), d.signalOut, p.sr); if fl == 32, wr(fullfile(md, 'speech_in.wav'), d.signalIn, p.sr); end
  end
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
  r.settings = report_settings(p, 'female', 'pcf', PCF, 'ost', fileread('cfg/one.ost'), 'sequence', {{'frameLen 32', 'frameLen 48'}}, ...
     'switching', 'the same warp PCF at frameLen 32 and 48 (24 kHz)', 'input', 'a 300-1260 Hz sweep for the lag measurement; real speech CMU ARCTIC clb a0018 for listening');
  report_json(fullfile(report_outdir('warp-48'), 'data.json'), r);
% ------------------------------------------------------------------------------------------------ pitch-shifting noise-like segments
case 'pvocnoise'
  md = mdir('pvoc-noise'); m = M(strcmp({M.id}, 'arctic_slt_a0036')); x = corpus_wav(m); s = x(round(0.16*fs):round(0.30*fs));   % the /S/ of "She" (ARCTIC label 0.149-0.306 s)
  v = x(round(0.31*fs):round(0.58*fs));   % the following voiced stretch /i t er/ (a voiced control)
  nz = randn(round(0.4*fs), 1); [b, a] = butter(4, [3500 9000] / (fs/2)); nz = filter(b, a, nz); nz = 0.05 * nz / rms(nz);           % an /s/-like noise band
  segs = {'sh_real', [1e-4*randn(round(0.1*fs),1); s; 1e-4*randn(round(0.1*fs),1)]; 's_noise', [1e-4*randn(round(0.1*fs),1); nz; 1e-4*randn(round(0.1*fs),1)]; 'voiced', [1e-4*randn(round(0.1*fs),1); v; 1e-4*randn(round(0.1*fs),1)]};
  sts = [-4 -2 0 2 4]; r = struct('st', sts);
  for i = 1:3
    for k = 1:numel(sts)
      p = getAudapterDefaultParams('female'); p.downFact = 2; p.sr = 24000; p.frameLen = 48; p.nDelay = 3; p.bPitchShift = 1; p.pitchShiftRatio = 2^(sts(k)/12); p.fb = 1;
      d = run_trial(p, segs{i,2}); a0 = round(0.13*p.sr); a1 = numel(d.signalOut) - round(0.11*p.sr); L(k) = 20*log10(rms(d.signalOut(a0:a1)) + 1e-12);   % inside the segment (pad 0.1 s, lag < 0.03 s)
      wr(fullfile(md, sprintf('%s_st%+d.wav', segs{i,1}, sts(k))), d.signalOut, p.sr);
    end
    r.(segs{i,1}) = L - L(sts == 0);
    printf('pvocnoise %s: level re 0 st at %s st = %s dB\n', segs{i,1}, mat2str(sts), mat2str(round(r.(segs{i,1})*100)/100));
  end
  r.settings = report_settings(p, 'female', 'sequence', {{'-4 st', '-2 st', '0 st', '+2 st', '+4 st'}}, 'switching', 'one trial per shift', ...
     'input', 'real /S/ of CMU ARCTIC slt a0036 ("She ..."), the voiced stretch after it, and an /s/-like noise band (3.5-9 kHz)');
  report_json(fullfile(report_outdir('pvoc-noise'), 'data.json'), r);
% ------------------------------------------------------------------------------------------------ re-init from data.params
case 'reinit'
  p = getAudapterDefaultParams('male'); p.fb = 1; p.frameLen = 64; p.nDelay = 7; p.bTimeDomainShift = 1; p.bCepsLift = 1; p.pitchLowerBoundHz = 70; p.pitchUpperBoundHz = 200;
  p.timeDomainPitchShiftSchedule = [0, 2^(2/12); 5, 2^(2/12)];
  x = cut('arctic_bdl_a0005', 0, 1.3); d1 = run_trial(p, x); dp = d1.params; r = struct();
  try, AudapterIO('init', dp); r.direct = 'accepted'; catch err, r.direct = err.message; end
  % what a re-analysis tool has to do: map data.params' names back to the MATLAB field names AudapterIO reads
  map = {'scale','dScale'; 'preemp','preempFact'; 'rmsThr','rmsThresh'; 'rmsRatio','rmsRatioThresh'; 'rmsFF','rmsForgFact'; 'dFmtsFF','dFmtsForgFact'; ...
         'f1Min','F1Min'; 'f1Max','F1Max'; 'f2Min','F2Min'; 'f2Max','F2Max'; 'bGainAdapt','gainAdapt'; 'clampf1','clamp_f1'; 'clampf2','clamp_f2'; 'clamposts','clamp_osts'};
  q = dp; for i = 1:size(map,1), if isfield(q, map{i,1}), q.(map{i,2}) = q.(map{i,1}); end, end
  if isempty(q.rmsFF_fb), q.rmsFF_fb = [0.85 0.85 0 0]; r.filled_rmsFF_fb = 1; end   % as a re-analysis tool has to, since it is logged empty
  names = {'rmsff_fb', 'btimedomainshift', 'pitchlowerboundhz', 'pitchupperboundhz', 'bcepslift', 'framelen', 'ndelay', 'fb'};
  AudapterIO('init', p); for i = 1:numel(names), before{i} = Audapter('getParam', names{i}); end
  try
    AudapterIO('init', q); for i = 1:numel(names), after{i} = Audapter('getParam', names{i}); end
    d2 = run_trial(q, x, 'init', false); r.mapped = 'accepted';
  catch err, r.mapped = err.message; after = before; d2 = d1; end
  r.changed = {}; for i = 1:numel(names), if ~isequal(before{i}, after{i}), r.changed{end+1} = sprintf('%s %s -> %s', names{i}, mat2str(before{i}, 3), mat2str(after{i}, 3)); end, end
  r.fields_missing = {}; for f = {'bTimeDomainShift', 'pitchLowerBoundHz', 'pitchUpperBoundHz', 'timeDomainPitchShiftSchedule'}, if ~isfield(dp, f{1}), r.fields_missing{end+1} = f{1}; end, end
  r.rmsFF_fb_logged = dp.rmsFF_fb; fi = est_f0(d1.signalIn, p.sr);
  r.cents_before = 1200*log2(est_f0(d1.signalOut, p.sr)/fi); r.cents_after = 1200*log2(est_f0(d2.signalOut, p.sr)/fi);
  printf('reinit: AudapterIO(''init'', data.params) directly: %s\n', r.direct);
  printf('reinit: after mapping names: %s; changed: %s; missing from data.params: %s; rmsFF_fb logged as %s; pitch shift %+.0f cents before, %+.0f after\n', ...
         r.mapped, strjoin(r.changed, '; '), strjoin(r.fields_missing, ', '), mat2str(r.rmsFF_fb_logged), r.cents_before, r.cents_after);
  report_json(fullfile(report_outdir('reinit-params'), 'data.json'), r);
% ------------------------------------------------------------------------------------------------ optional fields persist across init
case 'persist'
  md = mdir('init-persist'); x = cut('arctic_clb_a0030', 0, 1.7);
  p1 = getAudapterDefaultParams('female'); p1.fb = 1; p1.bPitchShift = 1;     % block 1: a pitch block
  p2 = getAudapterDefaultParams('female'); p2.fb = 1; if isfield(p2, 'bPitchShift'), p2 = rmfield(p2, 'bPitchShift'); end   % block 2 builds p without the field
  pr = getAudapterDefaultParams('female'); pr.fb = 1; pr.bPitchShift = 0;
  AudapterIO('init', pr); dr = run_trial(pr, x, 'init', false); wr(fullfile(md, 'expected.wav'), dr.signalOut, pr.sr);
  AudapterIO('init', p1); run_trial(p1, x, 'init', false);
  AudapterIO('init', p2); d2 = run_trial(p2, x, 'init', false); wr(fullfile(md, 'observed.wav'), d2.signalOut, p2.sr); wr(fullfile(md, 'in.wav'), d2.signalIn, p2.sr);
  L = @(d) 20*log10(rms(d.signalOut(1600:end)) / rms(d.signalIn(1600:end)));
  r = struct('exp_db', L(dr), 'obs_db', L(d2), 'bpitchshift_after', Audapter('getParam', 'bpitchshift'), 'has_field_default', isfield(getAudapterDefaultParams('female'), 'bPitchShift'));
  printf('persist: block 2 without p.bPitchShift: Audapter bPitchShift = %d; level %+.2f dB (expected %+.2f dB)\n', r.bpitchshift_after, r.obs_db, r.exp_db);
  r.settings = report_settings(p2, 'female', 'sequence', {{'block 1: p.bPitchShift = 1', 'block 2: p built without the bPitchShift field'}}, ...
     'switching', 'AudapterIO(''init'', p) at the start of each block', 'input', 'real speech: CMU ARCTIC clb a0030');
  report_json(fullfile(report_outdir('init-persist'), 'data.json'), r);
% ------------------------------------------------------------------------------------------------ zero-length warp row abort (COORD-10)
case 'warpabort'
  p = getAudapterDefaultParams('female'); p.downFact = 2; p.sr = 24000; p.frameLen = 32; p.nDelay = 3; p.bPitchShift = 1; p.fb = 1;
  fid = fopen('cfg/rp2_zw.pcf','w'); fprintf(fid, '1\n1, 0.05, 0.5, 0.0, 0.2, 2.0\n\n2\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n'); fclose(fid);
  x = 1e-4*randn(round(0.6*48000), 1); fr = p.frameLen / p.sr; res = [];
  for s = 20:40
    fid = fopen('cfg/rp2_zw.ost','w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 2\n0 ELAPSED_TIME %.6f NaN {}\n1 OST_END NaN NaN {}\n\nn = 0\n', (s - 1 + 0.5) * fr); fclose(fid);
    AudapterIO('init', p); Audapter('ost', 'cfg/rp2_zw.ost', 0); Audapter('pcf', 'cfg/rp2_zw.pcf', 0);
    ok = 1; try, d = run_trial(p, x, 'init', false); s1 = find(d.ost_stat >= 1, 1); catch err, ok = 0; s1 = NaN; end
    res(end+1, :) = [s, ok]; printf('warpabort: anchor state entered at frame %d: %s\n', s, ifelse_str(ok, 'runs', 'aborts'));
  end
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
  report_json(fullfile(report_outdir('coord-10'), 'data.json'), struct('frames', res(:,1)', 'runs', res(:,2)', 'frame_s', fr));
end

