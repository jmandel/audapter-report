% EXP: trial-to-trial carry-over in MIXED designs (perturbed and unperturbed trials interleaved), using the
% switching methods of real blab experiments (public code, other/blab-experiments) and realistic sequences.
% Each (token, condition) pair runs in two sessions with opposite trial order; a trial is free of carry-over
% if its logged fmts/sfmts/ost_stat (fb 3, as run) and, in a speech-only rerun (fb 1), its signalOut are
% bit-identical in both orders. For catch trials we also report what was delivered.
%  S1  field mode, per-trial setParam pertAmp/pertPhi (0 = catch), OST/PCF nullified, init once, reset per trial:
%      attentionAAF run_attentionComp_audapter.m:37-55,202-208 (conds noShift/shiftIH/shiftAE, words head/bed/dead,
%      125 mel), same method in uhdapter, simonMulti Exp1 coAdapt and the free-speech modelComp template.
%  S2  PCF rewritten and reloaded per trial, OST loaded once, init once: simonMulti Exp2 run_simonMultisyllable_v2_audapter.m
%      :31-66,96-110 (sevXXXMaster.ost; amplitude in rows 0-3 = first vowel only; "level" is always noShift = 0).
%  S3  leftover PCF across experiments (COORD-1) with blab's own files: what the runners' Audapter('ost'/'pcf','',0)
%      lines protect against (a field experiment run right after the measureFormants calibration or a SimOn block).
%  S4  pitch-shift catch trials made by clearing the PCF vs by loading a zero PCF (OST-F5): no public blab pitch
%      experiment, so this is labelled "could trigger if".
%  S5  OST-F1 in a mixed "shift the first word" design with catch trials, per onset rule; with and without
%      reloading the OST before every trial.
%  S4b as S4 for a sustained-vowel design whose trials end while still shifted.
% Usage: ./run-oct.sh exp_mixed.m    (SCEN=S1..S5 or S4b runs one)
addpath('/a/other/blab-experiments/free-speech/experiment_helpers', '-end');
R = '/a/other/blab-experiments'; sc = getenv('SCEN'); run_ = @(s) isempty(sc) || strcmp(sc, s);
hz2mel = @(f) 1127.01048 * log(1 + f / 700);
p0 = getAudapterDefaultParams('female'); p0.downFact = 3; p0.sr = 16000; p0.frameLen = 32;
p0.bShift = 1; p0.bRatioShift = 0; p0.bMelShift = 1; p0.fb3Gain = 0.02;
fs = p0.sr * p0.downFact; w = get_noiseSource(p0); randn('seed', 5);
EH = [731 2058 2979 4000]; BW = [80 100 150 200];
word = @(d, f0) [1e-4*randn(round(0.35*fs),1); synth_vowel(fs, d, f0, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); 1e-4*randn(round(0.6*fs),1)];
M = corpus_index(); cl = {'arctic_clb_a0005', 'arctic_slt_a0018', 'arctic_clb_a0030', 'arctic_slt_a0036'};
real_ = cell(1, numel(cl)); for i = 1:numel(cl), x = corpus_wav(M(strcmp({M.id}, cl{i}))); real_{i} = x(1:min(end, round(1.6*fs))); end
same = @(a, b) isequal(a.fmts, b.fmts) && isequal(a.sfmts, b.sfmts) && isequal(a.ost_stat, b.ost_stat);

% ---------------------------------------------------------------- S1
if run_('S1')
  printf('\n=== S1 field mode, per-trial setParam (attentionComp/uhdapter/coAdapt/modelComp method)\n');
  tok = {word(0.30, 205), word(0.55, 215), word(0.25, 210), word(0.40, 200), real_{:}};
  cond = [125 0; 125 0; 0 0; 125 pi; 0 0; 0 0; 125 0; 0 0];          % [amp(mel) phi]; 0 = noShift catch
  nm = {'shiftAE', 'shiftIH'}; T = numel(tok);
  for fbm = [3 1]
    p = p0; p.fb = fbm; Audapter('ost', '', 0); Audapter('pcf', '', 0);
    Audapter('setParam', 'datapb', w, 1); AudapterIO('init', p);
    res = cell(2, T);
    for o = 1:2
      seq = 1:T; if o == 2, seq = fliplr(seq); end
      for k = seq
        Audapter('setParam', 'pertAmp', cond(k,1) * ones(1, 257)); Audapter('setParam', 'pertPhi', cond(k,2) * ones(1, 257));
        res{o,k} = exp_trial(p, tok{k});
      end
    end
    for k = 1:T
      a = res{1,k}; b = res{2,k};
      if fbm == 3
        if cond(k,1) == 0, c = 'noShift'; else, c = nm{1 + (cond(k,2) > 0)}; end
        printf('fb3 trial %d (%s, %s): shifted %.3f s, logged dF1 %+.1f mel, output/input F1 %.3f | fwd==rev logged: %d\n', ...
               k, c, ifelse_str(k > 4, cl{max(k-4,1)}, 'synthetic'), a.shift_s, a.dF1mel, a.outF1, same(a.d, b.d));
      else
        printf('fb1 trial %d: fwd==rev signalOut bit-identical: %d\n', k, isequal(a.d.signalOut, b.d.signalOut));
      end
    end
  end
end

% ---------------------------------------------------------------- S2
if run_('S2')
  printf('\n=== S2 PCF rewritten+reloaded per trial, OST once, init once (simonMultisyllable_v2, sevXXXMaster.ost)\n');
  two = @(d1, d2) [1e-4*randn(round(0.3*fs),1); synth_vowel(fs, d1, 210, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); ...
                   3e-3*randn(round(0.07*fs),1); synth_vowel(fs, d2, 200, [500 1500 2600 4000], BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); 1e-4*randn(round(0.5*fs),1)];
  d1s = [0.20 0.26 0.18 0.60 0.22 0.20 0.30 0.24]; d2s = [0.25 0.30 0.22 0.30 0.26 0.20 0.35 0.28];
  tok = arrayfun(@(i) two(d1s(i), d2s(i)), 1:8, 'UniformOutput', false);
  amp = [125 125 0 125 0 125 0 125];   % "level" (catch, amplitude 0 in all rows) interleaved with "seven"/"sever"
  p = p0; p.fb = 3; p.rmsForgFact = 0.89; pcf = 'cfg/exp_mixed_s2.pcf';
  Audapter('ost', [R '/simonMulti/experiment scripts/Exp2/sevXXXMaster.ost'], 0);
  Audapter('setParam', 'datapb', w, 1); AudapterIO('init', p); T = numel(tok); res = cell(2, T);
  for o = 1:2
    seq = 1:T; if o == 2, seq = fliplr(seq); end
    for k = seq
      fid = fopen(pcf, 'w'); fprintf(fid, '0\n\n9\n'); for s = 0:8, fprintf(fid, '%d, 0.0, 0, %g, %g\n', s, amp(k) * (s <= 3), 0); end; fclose(fid);   % amp in rows 0-3 only (lines 103-104)
      Audapter('pcf', pcf, 0); res{o,k} = exp_trial(p, tok{k});
    end
  end
  for k = 1:T
    a = res{1,k}; b = res{2,k};
    o4 = find(a.d.ost_stat >= 4, 1); if isempty(o4), t4 = NaN; else, t4 = (o4 - 1) * p.frameLen / p.sr; end
    printf('trial %d (%s): V1 0.30-%.2f s | shifted %.3f s (%.3f-%.3f), state 4 (V1 offset) %.3f s, logged dF1 %+.1f mel, output/input F1 %.3f | fwd==rev logged: %d\n', ...
           k, ifelse_str(amp(k) > 0, 'shift', 'level/catch'), 0.30 + d1s(k), a.shift_s, a.on, a.off, t4, a.dF1mel, a.outF1, same(a.d, b.d));
  end
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
end

% ---------------------------------------------------------------- S3
if run_('S3')
  printf('\n=== S3 leftover OST/PCF from an earlier block in the same MATLAB session (COORD-1), blab files\n');
  x = word(0.40, 210); p = p0; p.fb = 3; Audapter('setParam', 'datapb', w, 1);
  % (i) calibration block: measureFormants OST+PCF (all-zero PCF), then a field-mode block WITHOUT the nullify lines
  Audapter('ost', [R '/free-speech/experiment_helpers/measureFormants.ost'], 0);
  Audapter('pcf', [R '/free-speech/experiment_helpers/measureFormants.pcf'], 0);
  AudapterIO('init', p); Audapter('setParam', 'pertAmp', 125 * ones(1, 257)); Audapter('setParam', 'pertPhi', zeros(1, 257));
  a = exp_trial(p, x);
  Audapter('ost', '', 0); Audapter('pcf', '', 0); AudapterIO('init', p);
  Audapter('setParam', 'pertAmp', 125 * ones(1, 257)); Audapter('setParam', 'pertPhi', zeros(1, 257)); b = exp_trial(p, x);
  printf('field F1 +125 mel after measureFormants block, not nullified: shifted %.3f s (output/input F1 %.3f); nullified as blab runners do: %.3f s (%.3f)\n', ...
         a.shift_s, a.outF1, b.shift_s, b.outF1);
  % (ii) SimOn block ends with a hold trial (bedhead PCF, 125 mel in all rows); next block is field mode with catch trials
  pcf = 'cfg/exp_mixed_s3.pcf'; fid = fopen(pcf, 'w'); fprintf(fid, '0\n\n9\n'); for s = 0:8, fprintf(fid, '%d, 0.0, 0, 125, 0\n', s); end; fclose(fid);
  Audapter('ost', [R '/simonSingleWord/experiment scripts/bedheadMaster.ost'], 0); Audapter('pcf', pcf, 0);
  AudapterIO('init', p); Audapter('setParam', 'pertAmp', zeros(1, 257)); c = exp_trial(p, x);
  Audapter('ost', '', 0); Audapter('pcf', '', 0); AudapterIO('init', p); Audapter('setParam', 'pertAmp', zeros(1, 257)); e = exp_trial(p, x);
  printf('field "noShift" (pertAmp 0) after a SimOn hold block, not nullified: shifted %.3f s, logged dF1 %+.1f mel (output/input F1 %.3f); nullified: %.3f s\n', ...
         c.shift_s, c.dF1mel, c.outF1, e.shift_s);
end

% ---------------------------------------------------------------- S4
if run_('S4')
  printf('\n=== S4 pitch catch trials: clearing the PCF vs loading a zero PCF (OST-F5; no public blab pitch experiment)\n');
  p = p0; p.bShift = 0; p.bPitchShift = 1; p.fb = 1;
  x = [1e-4*randn(round(0.3*fs),1); synth_vowel(fs, 0.8, 200, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); 1e-4*randn(round(0.4*fs),1)];
  ost = 'cfg/exp_mixed_s4.ost'; fid = fopen(ost, 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
  up = 'cfg/exp_mixed_s4_up.pcf'; fid = fopen(up, 'w'); fprintf(fid, '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 2.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n'); fclose(fid);
  z = 'cfg/exp_mixed_s4_zero.pcf'; fid = fopen(z, 'w'); fprintf(fid, '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n'); fclose(fid);
  AudapterIO('init', p); Audapter('ost', ost, 0);
  f0i = est_f0(x(1:3:end), p.sr);
  Audapter('pcf', up, 0); a = exp_trial(p, x);
  Audapter('pcf', '', 0); b = exp_trial(p, x);                 % catch made by clearing the PCF
  Audapter('pcf', up, 0); c = exp_trial(p, x);
  Audapter('pcf', z, 0);  e = exp_trial(p, x);                 % catch made by a zero PCF
  f = @(r) 1200*log2(est_f0(r.d.signalOut, p.sr) / f0i);
  printf('input F0 %.1f Hz | +2 st trial: %+.0f cents | catch by Audapter(''pcf'','''',0): %+.0f cents (logged params.pitchShiftRatio %.4f) | +2 st: %+.0f | catch by zero PCF: %+.0f cents\n', ...
         f0i, f(a), f(b), b.d.params.pitchShiftRatio, f(c), f(e));
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
end

% ---------------------------------------------------------------- S4b
if run_('S4b')
  printf('\n=== S4b as S4, but a sustained-vowel design: phonation continues until the trial is stopped, so the trial ends in the shifted state\n');
  p = p0; p.bShift = 0; p.bPitchShift = 1; p.fb = 1;
  x = [1e-4*randn(round(0.3*fs),1); synth_vowel(fs, 1.2, 200, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0)];   % stop mid-vowel
  xc = [1e-4*randn(round(0.3*fs),1); synth_vowel(fs, 0.8, 200, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); 1e-4*randn(round(0.4*fs),1)];
  ost = 'cfg/exp_mixed_s4.ost'; fid = fopen(ost, 'w'); fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.02 {}\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
  up = 'cfg/exp_mixed_s4_up.pcf'; fid = fopen(up, 'w'); fprintf(fid, '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 2.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n'); fclose(fid);
  z = 'cfg/exp_mixed_s4_zero.pcf'; fid = fopen(z, 'w'); fprintf(fid, '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n'); fclose(fid);
  AudapterIO('init', p); Audapter('ost', ost, 0); f0i = est_f0(xc(1:3:end), p.sr);
  f = @(r) 1200*log2(est_f0(r.d.signalOut, p.sr) / f0i);
  Audapter('pcf', up, 0); a = exp_trial(p, x);
  Audapter('pcf', '', 0); b = exp_trial(p, xc);
  Audapter('pcf', up, 0); c = exp_trial(p, x);
  Audapter('pcf', z, 0);  e = exp_trial(p, xc);
  printf('input F0 %.1f Hz | +2 st trial (ends while shifted): %+.0f cents | next trial, catch by Audapter(''pcf'','''',0): %+.0f cents, logged params.pitchShiftRatio %.4f | +2 st: %+.0f | catch by zero PCF: %+.0f cents\n', ...
         f0i, f(a), f(b), b.d.params.pitchShiftRatio, f(c), f(e));
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
end

% ---------------------------------------------------------------- S5
if run_('S5')
  printf('\n=== S5 OST-F1 in a mixed "shift the first word" design with catch trials (F1 +125 mel in state 2)\n');
  V2 = [500 1500 2600 4000];
  sent = @(d1) [1e-4*randn(round(0.15*fs),1); synth_vowel(fs, d1, 210, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3); ...
                1e-4*randn(round(0.25*fs),1); synth_vowel(fs, 0.5, 200, V2, BW, 'onset', 0, 'offset', 0, 'amp', 0.3); 1e-4*randn(round(0.3*fs),1)];
  w1 = [0.30 0.35 1.20 0.30 0.40 0.90 0.35 0.30]; catchT = [0 0 1 0 0 1 0 0];   % catch trials happen to have long first words
  des = {'blab-style RISE_HOLD_POS_SLOPE -> FALL (measureFormants rules)', '0 INTENSITY_RISE_HOLD_POS_SLOPE 0.01 0.05 {}'; ...
         'RMS-floor onset (blab mode 32) -> FALL', '0 INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR 0.2 0.02 {}'};
  on = 'cfg/exp_mixed_s5.pcf'; off = 'cfg/exp_mixed_s5_catch.pcf';
  fid = fopen(on, 'w'); fprintf(fid, '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 125, 0\n3, 0.0, 0, 0, 0\n'); fclose(fid);
  fid = fopen(off, 'w'); fprintf(fid, '0\n\n4\n0, 0.0, 0, 0, 0\n1, 0.0, 0, 0, 0\n2, 0.0, 0, 0, 0\n3, 0.0, 0, 0, 0\n'); fclose(fid);
  p = p0; p.fb = 3;
  for di = 1:size(des, 1)
    for reload = [0 1]
      ost = 'cfg/exp_mixed_s5.ost'; fid = fopen(ost, 'w');
      fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n%s\n2 INTENSITY_FALL 0.01 0.02 {}\n3 OST_END NaN NaN {}\n\nn = 0\n', des{di,2}); fclose(fid);
      printf('-- %s; OST %s\n', des{di,1}, ifelse_str(reload, 'reloaded before every trial', 'loaded once'));
      Audapter('setParam', 'datapb', w, 1); AudapterIO('init', p); Audapter('ost', ost, 0);
      for k = 1:numel(w1)
        if reload, Audapter('ost', ost, 0); end
        if catchT(k), Audapter('pcf', off, 0); else, Audapter('pcf', on, 0); end
        r = exp_trial(p, sent(w1(k)));
        if di == 2 && ~reload && any(k == [1 4])        % expected (trial 1) vs observed (trial 4, same first-word length)
          od = '/h/oct/out/exp'; if ~exist(od, 'dir'), mkdir(od); end
          audiowrite(sprintf('%s/s5_mode32_trial%d_out.wav', od, k), r.d.signalOut / 1.2, p.sr);
          audiowrite(sprintf('%s/s5_mode32_trial%d_in.wav', od, k), r.d.signalIn / 1.2, p.sr);
        end
        o = r.d.ost_stat(:); t3 = (find(o >= 3, 1) - 1) * (p.frameLen / p.sr); if isempty(t3), t3 = NaN; end
        we = 0.15 + w1(k);
        if catchT(k)
          printf('  trial %d CATCH  word 1 0.15-%.2f s | state 3 (offset) at %.3f s | shifted %.3f s\n', k, we, t3, r.shift_s);
        else
          printf('  trial %d shift  word 1 0.15-%.2f s | state 3 (offset) at %.3f s | F1 +125 mel %.3f-%.3f s (%.2f s past word 1)%s\n', ...
                 k, we, t3, r.on, r.off, max(r.off - we, 0), ifelse_str(r.off > we + 0.1, '  <-- into word 2', ''));
        end
      end
    end
  end
  Audapter('ost', '', 0); Audapter('pcf', '', 0);
end
