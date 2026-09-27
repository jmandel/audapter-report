function corpus_ost_summary()
% Summary + PASS/FAIL for corpus_ost.csv and corpus_ost_leak.csv.
fid = fopen('/h/oct/out/corpus_ost.csv'); h = strsplit(fgetl(fid), ',');
C = textscan(fid, ['%s%s' repmat('%f', 1, numel(h)-2)], 'Delimiter', ','); fclose(fid);
S = struct(); for k = 1:numel(h), S.(h{k}) = C{k}; end
srcs = unique(S.source)'; lv = unique(S.level)';
printf('\n== OST example_data/ost on real utterances: onset (state 2) and "end of first word" (state 4) vs references\n');
printf('   onset lag = t_onset - reference speech onset; fall err = t_fall - reference end of first word (ARCTIC: forced alignment; others: first energy segment)\n');
for s = srcs
  for L = lv
    i = strcmp(S.source, s{1}) & abs(S.level - L) < 1e-6;
    lag = S.t_onset(i) - S.ref_onset(i); fe = S.t_fall(i) - S.ref_word1_end(i); vl = S.t_onset(i) - S.ref_vowel_onset(i);
    printf('  %-10s level %.3f n=%2d | onset: missed %d, lag median %+4.0f ms [%+4.0f..%+4.0f]', s{1}, L, nnz(i), nnz(isnan(lag)), 1000*median(lag, 'omitnan'), 1000*min(lag), 1000*max(lag));
    if any(~isnan(vl)), printf(' (vs 1st vowel %+4.0f ms)', 1000*median(vl, 'omitnan')); end
    printf(' | fall: none %d, within 50 ms of word end %d/%d, median err %+5.0f ms\n', nnz(isnan(fe)), nnz(abs(fe) <= 0.05), nnz(i), 1000*median(fe, 'omitnan'));
  end
end
i = abs(S.level - 0.05) < 1e-6 & ~strcmp(S.source, 'vbd'); lag = S.t_onset(i) - S.ref_onset(i);
T('corpus OST onset detected, clean clips at nominal level', ~any(isnan(lag)), '%d missed', nnz(isnan(lag)));
j = abs(S.level - 0.05) < 1e-6 & strcmp(S.source, 'arctic'); vl = S.t_onset(j) - S.ref_vowel_onset(j);
T('corpus OST onset within -20..+100 ms of first vowel (ARCTIC, nominal)', all(vl > -0.02 & vl < 0.1), 'range %+.0f..%+.0f ms; out: %s', 1000*min(vl), 1000*max(vl), strjoin(S.id(j)(~(vl > -0.02 & vl < 0.1))', ' '));
i = abs(S.level - 0.05) < 1e-6 & strcmp(S.source, 'vbd'); lag = S.t_onset(i) - S.ref_onset(i);
T('corpus OST onset in noise (2.5-7.5 dB SNR) not before speech', all(lag > -0.02), 'premature on %d/%d: %s', nnz(lag <= -0.02), nnz(i), strjoin(S.id(i)(lag <= -0.02)', ' '));
i = abs(S.level - 0.05) < 1e-6 & strcmp(S.source, 'arctic'); fe = S.t_fall(i) - S.ref_word1_end(i);
printf('  ARCTIC nominal: fall within 50 ms of true first-word end on %d/%d; fired inside word 1 or later words otherwise\n', nnz(abs(fe) <= 0.05), nnz(i));
for f = {'corpus_ost_leak', 'example ost (RISE_HOLD -> FALL -> ELAPSED), OST not reloaded'; 'corpus_ost_leak2', 'ELAPSED 0.1 -> INTENSITY_FALL (OST-F1 pattern), OST reloaded each trial'}'
  fid = fopen(['/h/oct/out/' f{1} '.csv']); fgetl(fid); L = textscan(fid, '%s%s%f%f%f%f', 'Delimiter', ','); fclose(fid);
  printf('\n== Cross-trial OST leak on real speech, %s: trial B alone vs trial B after trial A\n', f{2});
  for k = 1:numel(L{1})
    printf('  %-24s after %-20s state-2 %.3f -> %.3f s, state-4 %.3f -> %.3f s\n', L{2}{k}, L{1}{k}, L{3}(k), L{5}(k), L{4}(k), L{6}(k));
  end
  ok = abs(L{3} - L{5}) < 0.005 & (abs(L{4} - L{6}) < 0.005 | (isnan(L{4}) & isnan(L{6})));
  T(['corpus OST no cross-trial leak: ' f{1}], all(ok), '%d/%d trial pairs changed', nnz(~ok), numel(ok));
end
end
