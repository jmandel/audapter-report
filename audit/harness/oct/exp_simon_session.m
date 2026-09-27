% EXP: blab "SimOn" designs with their REAL public OST files, run the way the lab runs them.
% Loop as in simonSingleWord run_simonSingleWord_v2_audapter.m:47-52,131-154: OST loaded once; every trial the
% PCF is rewritten (states 0-3: angle 1, 4-8: angle 2, all states: amp) and reloaded, fb set and
% AudapterIO('init') called, then reset/start. shiftMag 125 mel (run_simonSingleWord_v2_expt.m:51),
% bMelShift=1, bRatioShift=0, frameLen 32 at 16 kHz (downFact 3).
% Stimulus: synthetic female "bedhead"-like tokens: vowel 1, a 70 ms low-level gap, vowel 2; per-trial
% durations vary (a realistic spread plus one very long first vowel and one silent/missed trial).
% The same tokens run in forward and in reversed order in one session each: if OST state carried over
% between trials, a token's state timeline would depend on what came before it.
% Also: measureFormants.ost (free-speech) as run by run_measureFormants_audapter.m (bShift=0): its
% INTENSITY_FALL is numbered as a +2 rule (next rule at 4), so the FALL fires twice.
% Usage: ./run-oct.sh exp_simon_session.m
addpath('/a/other/blab-experiments/free-speech/experiment_helpers', '-end');
R = '/a/other/blab-experiments'; ifempty_ = @(x) [x NaN](1);
osts = {'bedhead (simonSingleWord)', [R '/simonSingleWord/experiment scripts/bedheadMaster.ost']; ...
        'sevXXX (simonMultisyllable_v2)', [R '/simonMulti/experiment scripts/Exp2/sevXXXMaster.ost']; ...
        'pedXXX (simonMultisyllable)', [R '/simonMulti/experiment scripts/Exp3/pedXXXMaster.ost']};
p = getAudapterDefaultParams('female');
p.downFact = 3; p.sr = 16000; p.frameLen = 32; p.bPitchShift = 0; p.bShift = 1; p.bRatioShift = 0; p.bMelShift = 1;
p.fb = 3; p.fb3Gain = 0.02; p.fb2Gain = 0.16;
fs = p.sr * p.downFact; fr = p.frameLen / p.sr; hz2mel = @(f) 1127.01048 * log(1 + f / 700);
EH = [731 2058 2979 4000]; BW = [80 100 150 200];
randn('seed', 7);
mk = @(d1, gap, d2) [1e-4*randn(round(0.30*fs),1); synth_vowel(fs, d1, 210, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); ...
                     3e-3*randn(round(gap*fs),1); synth_vowel(fs, d2, 200, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); 1e-4*randn(round(0.5*fs),1)];
T = [0.18 0.07 0.22; 0.25 0.07 0.28; 0.90 0.07 0.30; 0.20 0.07 0.20; 0.35 0.07 0.40; 0.16 0.07 0.18];
tok = cell(1, size(T,1)); for k = 1:size(T,1), tok{k} = mk(T(k,1), T(k,2), T(k,3)); end
tok{end+1} = 1e-4*randn(round(1.8*fs),1);      % missed trial (participant silent), re-run in the lab loop
w = get_noiseSource(p); Audapter('setParam', 'datapb', w, 1);
phi = [0 pi]; amp = 125;                         % F1 up on syllable 1, F1 down on syllable 2 (README design)
pcf = 'cfg/exp_simon.pcf';
for oi = 1:size(osts, 1)
  Audapter('ost', osts{oi,2}, 0);
  printf('\n=== %s: OST loaded once; PCF rewritten+reloaded, AudapterIO(''init'') every trial\n', osts{oi,1});
  res = struct();
  for order = 1:2
    seq = 1:numel(tok); if order == 2, seq = fliplr(seq); end
    for k = seq
      fid = fopen(pcf, 'w'); fprintf(fid, '# Section 1 (Time warping)\n0\n\n# Section 2\n9\n');
      for s = 0:8, fprintf(fid, '%d, 0.0, 0, %g, %g\n', s, amp, phi(1 + (s >= 4))); end
      fclose(fid);
      Audapter('pcf', pcf, 0); Audapter('setParam', 'fb', p.fb); AudapterIO('init', p);
      d = run_trial(p, tok{k}, 'init', false);
      res(order, k).ost = d.ost_stat(:); res(order, k).d = d;
    end
  end
  for k = 1:numel(tok)
    a = res(1,k).ost; b = res(2,k).ost; n = min(numel(a), numel(b));
    tr = @(o, s) (find(o >= s, 1) - 1) * fr;
    t = arrayfun(@(s) ifempty_(tr(a, s)), [2 4 6 8]);
    same = isequal(a(1:n), b(1:n));
    if k <= size(T,1)
      v1 = [0.30, 0.30 + T(k,1)]; v2 = v1(2) + T(k,2) + [0, T(k,3)];
      d = res(1,k).d; sh = hz2mel(d.sfmts(:,1)) - hz2mel(d.fmts(:,1)); sh(d.sfmts(:,1) == 0) = NaN;
      up = find(sh > 60); dn = find(sh < -60);
      flip = NaN; if ~isempty(dn), flip = (dn(1) - 1) * fr; end
      printf('trial %d: v1 %.2f-%.2f v2 %.2f-%.2f s | state2 %.3f  state4 %.3f  state6 %.3f  state8 %.3f | F1-down (angle 2) from %.3f s | fwd==rev ost_stat: %d\n', ...
             k, v1, v2, t, flip, same);
    else
      printf('trial %d (silent): max state %d | fwd==rev: %d\n', k, max(a), same);
    end
  end
end
% --- measureFormants.ost with a single vowel ("bed"), bShift 0, fb 3, as run_measureFormants_audapter.m
Audapter('ost', [R '/free-speech/experiment_helpers/measureFormants.ost'], 0);
Audapter('pcf', [R '/free-speech/experiment_helpers/measureFormants.pcf'], 0);
q = getAudapterDefaultParams('female'); q.bShift = 0; q.fb = 3; q.fb3Gain = 0.02; AudapterIO('init', q);
printf('\n=== measureFormants.ost (0 RISE_HOLD_POS_SLOPE / 2 INTENSITY_FALL / 4 OST_END), bShift 0, session of 5 "bed" tokens\n');
for dv = [0.25 0.60 0.20 0.35 0.18]
  x = [1e-4*randn(round(0.3*fs),1); synth_vowel(fs, dv, 210, EH, BW, 'onset', 0, 'offset', 0, 'amp', 0.3, 'ramp', 0.04); 1e-4*randn(round(0.5*fs),1)];
  d = run_trial(q, x, 'init', false); o = d.ost_stat(:);
  s2 = (find(o >= 2, 1) - 1) * fr; s3 = (find(o >= 3, 1) - 1) * fr; s4 = (find(o >= 4, 1) - 1) * fr;
  printf('vowel 0.30-%.2f s: state2 %.3f  state3 (1st FALL) %.3f  state4 (2nd FALL) %.3f  -> state 3 lasts %.0f ms\n', 0.3 + dv, s2, s3, s4, 1000*(s4 - s3));
end
Audapter('ost', '', 0); Audapter('pcf', '', 0);
