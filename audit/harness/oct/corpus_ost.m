% CORPUS: OST rules on real multi-word utterances, using the upstream example_data 'ost' file:
%   0 INTENSITY_RISE_HOLD 0.02 0.02 (onset of first word) -> state 2
%   2 INTENSITY_FALL      0.01 0.01 (end of first word)   -> state 4
%   4 ELAPSED_TIME 0.48                                  -> state 5 (OST_END)
% References: ARCTIC forced alignment (speech onset = end of leading pause; first-vowel onset; end of the
% first word), otherwise the energy segments in corpus/ref/<id>.energy.csv.
% Part A: detection times vs references at three input levels.  Part B: cross-trial OST state leak (OST-F1)
% on real speech: trial B run after trial A without reloading the OST vs trial B with a fresh OST load.
M = corpus_index(); OST = '/a/blab/audapter_matlab/example_data/ost';
use = ismember({M.source}, {'arctic', 'libri', 'so762', 'vbd', 'blab', 'praat', 'freespeech'}) & ~ismember({M.id}, {'blab_diao1_female', 'blab_da1_male'});
M = M(use);
W1 = struct('a0005', 3, 'a0018', 3, 'a0030', 1, 'a0036', 2);   % phones in the first word of each ARCTIC prompt
VOW = {'aa','ae','ah','ao','aw','ay','eh','er','ey','ih','iy','ow','oy','uh','uw'};
1;
function t = stat_time(d, p, k)
  i = find(d.ost_stat >= k, 1); if isempty(i), t = NaN; else, t = (i - 0.5) * p.frameLen / p.sr; end
end
fo = fopen('/h/oct/out/corpus_ost.csv', 'w');
fprintf(fo, 'id,source,level,ref_onset,ref_vowel_onset,ref_word1_end,t_onset,t_fall,t_end,rms_at_onset_ref,energy_dip\n');
levels = [0.025 0.05 0.1];
for m = M
  rv = NaN; rw = NaN;
  if strcmp(m.source, 'arctic')
    P = corpus_phones([m.root '/' strtok(m.gt_file, ';')]); sp = ~ismember(P.ph, {'pau', 'ssil', 'h#'});
    j = find(sp); ro = P.t0(j(1)); jv = find(sp & ismember(P.ph, VOW), 1); rv = P.t0(jv);
    u = regexp(m.id, 'a\d{4}', 'match'){1}; rw = P.t1(j(W1.(u)));
  else
    E = corpus_csv([m.root '/ref/' m.id '.energy.csv']); ro = E(1,1); rw = E(1,2);
  end
  for lv = levels
    x = corpus_wav(m, lv);   % active-speech RMS = lv (peak-limited to 0.99)
    p = defparams(corpus_preset(m)); p.rmsThresh = 0.005;
    d = run_trial(p, x, 'ost', OST);
    fr = p.frameLen / p.sr; tt = ((1:numel(d.ost_stat))' - 0.5) * fr;
    to = stat_time(d, p, 2); tf = stat_time(d, p, 4); te = stat_time(d, p, 5);
    % was there a real energy dip below the fall threshold between onset and the detected fall?
    rr = d.rms(:,1); dip = NaN; if ~isnan(tf), dip = min(rr(tt > to & tt <= tf + 0.02)); end
    fprintf(fo, '%s,%s,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.4f,%.4f\n', m.id, m.source, lv, ro, rv, rw, to, tf, te, interp1(tt, rr, ro, 'nearest', NaN), dip);
  end
end
fclose(fo);
% ---- Part B: cross-trial leak on real speech (OST loaded once; Audapter('reset') between trials as in run_trial)
A = M(strcmp({M.source}, 'arctic')); B = M(strcmp({M.source}, 'libri'));
fb = fopen('/h/oct/out/corpus_ost_leak.csv', 'w'); fprintf(fb, 'trialA,trialB,fresh_onset,fresh_fall,after_onset,after_fall\n');
for k = 1:numel(B)
  a = A(k); b = B(k); [xa, ~] = corpus_wav(a, 0.05); [xb, ~] = corpus_wav(b, 0.05);
  p = defparams(corpus_preset(b)); p.rmsThresh = 0.005;
  d1 = run_trial(p, xb, 'ost', OST); f1 = [stat_time(d1, p, 2) stat_time(d1, p, 4)];
  pa = defparams(corpus_preset(a)); pa.rmsThresh = 0.005;
  run_trial(pa, [xa; zeros(round(0.3*48000), 1)], 'ost', OST);    % trial A (ends in silence)
  d2 = run_trial(p, xb);                                            % trial B, OST not reloaded
  f2 = [stat_time(d2, p, 2) stat_time(d2, p, 4)];
  fprintf(fb, '%s,%s,%.3f,%.3f,%.3f,%.3f\n', a.id, b.id, f1, f2);
end
fclose(fb);
% ---- Part B2: the OST-F1 rule pattern (INTENSITY_FALL after ELAPSED_TIME), OST reloaded before every trial
F = '/h/oct/out/corpus_fall.ost'; fid = fopen(F, 'w');
fprintf(fid, 'rmsSlopeWin = 0.030000\n\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n\nn = 0\n'); fclose(fid);
fb = fopen('/h/oct/out/corpus_ost_leak2.csv', 'w'); fprintf(fb, 'trialA,trialB,fresh_s2,fresh_s2b,after_s2,after_s2b\n');
for k = 1:numel(B)
  a = A(k); b = B(k); [xa, ~] = corpus_wav(a, 0.05); [xb, ~] = corpus_wav(b, 0.05);
  p = defparams(corpus_preset(b)); p.rmsThresh = 0.005; pa = defparams(corpus_preset(a)); pa.rmsThresh = 0.005;
  xa = [xa; zeros(round(0.3*48000), 1)];
  run_trial(p, zeros(48000, 1), 'ost', F);                    % neutral trial to clear anything left by earlier trials
  d1 = run_trial(p, xb, 'ost', F); f1 = [stat_time(d1, p, 2) stat_time(d1, p, 3)];
  run_trial(pa, xa, 'ost', F);                                % trial A: long utterance
  d2 = run_trial(p, xb, 'ost', F); f2 = [stat_time(d2, p, 2) stat_time(d2, p, 3)];
  fprintf(fb, '%s,%s,%.3f,%.3f,%.3f,%.3f\n', a.id, b.id, f1, f2);
end
fclose(fb); Audapter('ost', '', 0);
corpus_ost_summary();
