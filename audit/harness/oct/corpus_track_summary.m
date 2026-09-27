function corpus_track_summary(f)
% Summarise out/corpus_track.csv: by group (default params), by vowel (ARCTIC/sustained), nLPC sweep by group.
fid = fopen(f); h = strsplit(fgetl(fid), ','); C = textscan(fid, repmat('%s', 1, numel(h)), 'Delimiter', ','); fclose(fid);
S = struct(); for k = 1:numel(h), S.(h{k}) = C{k}; end
num = @(c) str2double(c);
F1 = num(S.F1_mare); F2 = num(S.F2_mare); G1 = num(S.F1_gross); G2 = num(S.F2_gross); B1 = num(S.F1_bias); B2 = num(S.F2_bias);
L1 = num(S.lpc_F1err); L2 = num(S.lpc_F2err); nl = num(S.nLPC); n = num(S.n);
C1 = num(S.F1_mare_cons); C2 = num(S.F2_mare_cons); GC = num(S.gross_cons); nc = num(S.n_cons); nc(isnan(C1)) = 0;
def = strncmp(S.param, 'default', 7);
printf('\n== Audapter default params (male/female by speaker sex; children use female) vs Praat reference\n');
printf('(MARE = median abs relative error; "consensus" = frames where Praat and the independent LPC agree within 10%%)\n');
printf('%-14s %5s %6s | %8s %8s | %7s %7s | %7s %7s | %-13s | %s\n', 'group', 'segs', 'frames', 'F1 MARE', 'F2 MARE', 'F1>20%', 'F2>20%', 'F1bias', 'F2bias', 'LPC vs Praat', 'consensus: frames F1/F2 MARE gross');
gs = unique(S.group);
for g = gs'
  i = def & strcmp(S.group, g{1});
  printf('%-14s %5d %6d | %7.1f%% %7.1f%% | %6.1f%% %6.1f%% | %+6.1f%% %+6.1f%% | %5.1f%% %5.1f%% | %5d %5.1f%% %5.1f%% %5.1f%%\n', g{1}, nnz(i), sum(n(i)), 100*wmed(F1(i), n(i)), 100*wmed(F2(i), n(i)), ...
    100*wmean(G1(i), n(i)), 100*wmean(G2(i), n(i)), 100*wmed(B1(i), n(i)), 100*wmed(B2(i), n(i)), 100*wmed(L1(i), n(i)), 100*wmed(L2(i), n(i)), ...
    sum(nc(i)), 100*wmed(C1(i), nc(i)), 100*wmed(C2(i), nc(i)), 100*wmean(GC(i), nc(i)));
end
for g = gs'
  i = def & strcmp(S.group, g{1});
  T(sprintf('corpus track %s: consensus-frame F1/F2 MARE < 5%%, gross < 10%%', g{1}), wmed(C1(i), nc(i)) < 0.05 && wmed(C2(i), nc(i)) < 0.05 && wmean(GC(i), nc(i)) < 0.1, ...
    'F1 %.1f%% F2 %.1f%% gross %.1f%% (%d frames)', 100*wmed(C1(i), nc(i)), 100*wmed(C2(i), nc(i)), 100*wmean(GC(i), nc(i)), sum(nc(i)));
end
printf('\n== by vowel (default params; ARCTIC vowel phones + sustained /a/ /i/)\n');
vs = unique(S.vowel(~strcmp(S.vowel, 'all')));
for v = vs'
  for sx = {'M', 'F'}
    i = def & strcmp(S.vowel, v{1}) & strcmp(S.sex, sx{1}) & ~strcmp(S.group, 'child');
    if ~any(i), continue; end
    printf('%-4s %s n=%4d  F1 MARE %5.1f%% bias %+6.1f%%   F2 MARE %5.1f%% bias %+6.1f%%   gross F1 %4.0f%% F2 %4.0f%%\n', v{1}, sx{1}, sum(n(i)), ...
      100*wmed(F1(i), n(i)), 100*wmed(B1(i), n(i)), 100*wmed(F2(i), n(i)), 100*wmed(B2(i), n(i)), 100*wmean(G1(i), n(i)), 100*wmean(G2(i), n(i)));
  end
end
printf('\n== nLPC sweep (female base params, nLPC overridden): median F1/F2 MARE and gross-error rate by group\n');
ns = unique(nl(strcmp(S.param, 'sweep')))';
printf('%-14s', 'group'); printf('   nLPC=%-2d        ', ns); printf('\n');
for g = gs'
  printf('%-14s', g{1});
  for k = ns
    i = strcmp(S.param, 'sweep') & nl == k & strcmp(S.group, g{1});
    printf(' %4.1f/%4.1f (%3.0f%%)', 100*wmed(F1(i), n(i)), 100*wmed(F2(i), n(i)), 100*wmean(max(G1(i), G2(i)), n(i)));
  end
  printf('\n');
end
end
function m = wmed(x, w)
ok = ~isnan(x); x = x(ok); w = w(ok); if isempty(x), m = NaN; return; end
[x, o] = sort(x); w = w(o); c = cumsum(w) / sum(w); m = x(find(c >= 0.5, 1));
end
function m = wmean(x, w)
ok = ~isnan(x); m = sum(x(ok) .* w(ok)) / sum(w(ok));
end
