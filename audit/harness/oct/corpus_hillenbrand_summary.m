function corpus_hillenbrand_summary(f)
% Summaries for corpus_hillenbrand.csv: per group, per vowel, per F0 band, nLPC sweep.
fid = fopen(f); h = strsplit(fgetl(fid), ',');
C = textscan(fid, ['%s%s%s%f%s' repmat('%f', 1, numel(h)-5)], 'Delimiter', ','); fclose(fid);
S = struct(); for k = 1:numel(h), S.(h{k}) = C{k}; end
e1 = (S.F1aud - S.F1ref) ./ S.F1ref; e2 = (S.F2aud - S.F2ref) ./ S.F2ref;
l1 = (S.F1lpc - S.F1ref) ./ S.F1ref; l2 = (S.F2lpc - S.F2ref) ./ S.F2ref;
ok = S.F1ref > 0 & S.F2ref > 0; D = strcmp(S.cfg, 'default');
G = {'m', 'men'; 'w', 'women'; 'b', 'boys'; 'g', 'girls'};
printf('\n== Hillenbrand steady state, Audapter default preset (men male / others female)\n');
printf('%-6s %4s %5s | %-22s | %-22s | %6s %6s | %-15s | %s\n', 'group', 'n', 'f0', 'F1 medAbsErr (Hz, %)', 'F2 medAbsErr (Hz, %)', 'F1>20%', 'F2>20%', 'nodata', 'indep LPC F1/F2 %');
for g = 1:4
  i = D & ok & strcmp(S.group, G{g,1}); j = i & ~isnan(e1);
  printf('%-6s %4d %5.0f | %6.0f Hz %5.1f%% %+5.1f%% | %6.0f Hz %5.1f%% %+5.1f%% | %5.1f%% %5.1f%% | %4d (%4.1f%%)   | %4.1f / %4.1f\n', G{g,2}, nnz(i), median(S.f0(i)), ...
    median(abs(S.F1aud(j) - S.F1ref(j))), 100*median(abs(e1(j))), 100*median(e1(j)), median(abs(S.F2aud(j) - S.F2ref(j))), 100*median(abs(e2(j))), 100*median(e2(j)), ...
    100*mean(abs(e1(j)) > 0.2), 100*mean(abs(e2(j)) > 0.2), nnz(i & isnan(e1)), 100*nnz(i & isnan(e1))/nnz(i), 100*median(abs(l1(j)), 'omitnan'), 100*median(abs(l2(j)), 'omitnan'));
end
printf('\n== per vowel (default preset): median abs error %% F1 / F2 [bias], by group\n%-4s', 'vow'); printf('   %-24s', G{:,2}); printf('\n');
vs = unique(S.vowel)';
for v = vs
  printf('%-4s', v{1});
  for g = 1:4
    j = D & ok & strcmp(S.group, G{g,1}) & strcmp(S.vowel, v{1}) & ~isnan(e1);
    printf('   %4.1f/%5.1f [%+5.1f/%+5.1f]', 100*median(abs(e1(j))), 100*median(abs(e2(j))), 100*median(e1(j)), 100*median(e2(j)));
  end
  printf('\n');
end
printf('\n== by F0 band (default preset, all groups)\n');
bands = [0 120; 120 170; 170 220; 220 260; 260 400];
for b = 1:size(bands, 1)
  j = D & ok & S.f0 >= bands(b,1) & S.f0 < bands(b,2) & ~isnan(e1);
  printf('F0 %3d-%3d Hz  n=%3d  F1 %5.1f%%  F2 %5.1f%%  gross(F1 or F2 >20%%) %5.1f%%\n', bands(b,:), nnz(j), 100*median(abs(e1(j))), 100*median(abs(e2(j))), 100*mean(abs(e1(j)) > 0.2 | abs(e2(j)) > 0.2));
end
printf('\n== nLPC sweep (female base): median abs error F1/F2 %% (gross %%) by group\n%-7s', 'group');
cf = {'nLPC9', 'nLPC11', 'nLPC13', 'nLPC15', 'nLPC17'}; printf('  %-19s', cf{:}); printf('\n');
for g = 1:4
  printf('%-7s', G{g,2});
  for c = cf
    j = strcmp(S.cfg, c{1}) & ok & strcmp(S.group, G{g,1}) & ~isnan(e1);
    printf('  %4.1f/%4.1f (%4.1f%%)', 100*median(abs(e1(j))), 100*median(abs(e2(j))), 100*mean(abs(e1(j)) > 0.2 | abs(e2(j)) > 0.2));
  end
  printf('\n');
end
printf('\n== trajectory (20/50/80%% points), default preset: mean abs error F1/F2 %%\n');
for g = 1:4
  j = D & strcmp(S.group, G{g,1}) & ~isnan(S.F1traj_err);
  printf('%-6s F1 %4.1f%% F2 %4.1f%%\n', G{g,2}, 100*median(S.F1traj_err(j)), 100*median(S.F2traj_err(j)));
end
end
