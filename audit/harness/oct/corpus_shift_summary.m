function corpus_shift_summary(f)
% Summary + PASS/FAIL lines for corpus_shift.csv.
fid = fopen(f); h = strsplit(fgetl(fid), ','); L = {};
while true, l = fgetl(fid); if ~ischar(l), break; end, L{end+1} = l; end; fclose(fid);
n = numel(L); id = cell(n,1); grp = id; cs = id; V = nan(n, numel(h) - 3);
for i = 1:n
  c = strsplit(L{i}, ',', 'CollapseDelimiters', false); id{i} = c{1}; grp{i} = c{2}; cs{i} = c{3};
  for k = 4:min(numel(c), numel(h)), if ~isempty(c{k}), V(i, k-3) = str2double(c{k}); end, end
end
col = @(name) V(:, find(strcmp(h, name)) - 3);
cF1 = col('cmdF1'); cF2 = col('cmdF2'); lF1 = col('logF1'); lF2 = col('logF2'); aF1 = col('audF1'); aF2 = col('audF2'); cov = col('coverage');
cc = col('cmd_cents'); oc = col('out_cents'); gd = col('gain_db'); nfr = col('nfr');
gs = unique(grp)';
printf('\n== formant shifts: |logged-commanded| and |measured-commanded| (ratio units), median [max] over clips; coverage = shifted/tracked frames\n');
for c = {'F1+20', 'F2-20', 'F1-20F2+20'}
  printf('-- %s\n', c{1});
  for g = gs
    i = strcmp(cs, c{1}) & strcmp(grp, g{1}); if ~any(i), continue; end
    el = max(abs(lF1(i) - cF1(i)), abs(lF2(i) - cF2(i))); ea = [abs(aF1(i) - cF1(i)), abs(aF2(i) - cF2(i))];
    printf('  %-14s n=%2d logged err %.4f [%.4f]  measured err F1 %.3f [%.3f] F2 %.3f [%.3f]  coverage %.2f [min %.2f]\n', g{1}, nnz(i), ...
      median(el, 'omitnan'), max(el), median(ea(:,1), 'omitnan'), max(ea(:,1)), median(ea(:,2), 'omitnan'), max(ea(:,2)), median(cov(i), 'omitnan'), min(cov(i)));
  end
  i = strcmp(cs, c{1});
  el = max(abs(lF1(i) - cF1(i)), abs(lF2(i) - cF2(i)));
  T(sprintf('corpus %s logged == commanded (all clips)', c{1}), all(el < 0.005 | isnan(el)) && ~any(isnan(el)), 'max err %.4f, %d clips with no shifted frames', max(el), nnz(isnan(el)));
  ea = max(abs(aF1(i) - cF1(i)), abs(aF2(i) - cF2(i)));
  T(sprintf('corpus %s measured within 0.05 (median)', c{1}), median(ea, 'omitnan') < 0.05, 'median %.3f; clips > 0.1: %s', median(ea, 'omitnan'), strjoin(id(i)(ea > 0.1)', ' '));
end
printf('\n== pvoc pitch shift: output cents error (median [worst]) and gain dB by group\n');
for st = [0 2 -2]
  c = sprintf('pvoc%+d', st);
  for g = gs
    i = strcmp(cs, c) & strcmp(grp, g{1}); if ~any(i), continue; end
    e = oc(i) - cc(i);
    printf('  %-6s %-14s n=%2d cents err %6.1f [%6.1f]  gain %+5.2f dB [%+5.2f..%+5.2f]\n', c, g{1}, nnz(i), median(e, 'omitnan'), max(abs(e)), median(gd(i)), min(gd(i)), max(gd(i)));
  end
  i = strcmp(cs, c); e = abs(oc(i) - cc(i));
  T(sprintf('corpus %s F0 within 10 cents', c), nnz(e > 10) <= 0, '%d/%d clips > 10 cents: %s', nnz(e > 10), nnz(i), strjoin(id(i)(e > 10)', ' '));
end
i0 = strcmp(cs, 'pvoc+0'); i2 = strcmp(cs, 'pvoc+2');
T('corpus pvoc no loudness step 0 -> +2 st', abs(median(gd(i2)) - median(gd(i0))) < 0.5, 'median gain 0 st %+.2f dB, +2 st %+.2f dB', median(gd(i0)), median(gd(i2)));
printf('\n== time-domain shift +1 st: output cents (frame-paired median [range]); logged shifted/tracked ratio (cents); Audapter pitch tracker vs reference F0\n');
for g = gs
  i = strcmp(cs, 'tds+1') & strcmp(grp, g{1}); j = strncmp(cs, 'tds_tracker', 11) & strcmp(grp, g{1}); if ~any(i), continue; end
  printf('  %-14s n=%2d out %6.1f [%6.1f..%6.1f] logged %6.1f [%6.1f..%6.1f] | tracker median err %5.1f%%, gross(>20%%) %5.1f%% [worst clip %5.1f%%]\n', g{1}, nnz(i), median(oc(i), 'omitnan'), ...
    min(oc(i)), max(oc(i)), median(gd(i), 'omitnan'), min(gd(i)), max(gd(i)), 100*median(aF1(j), 'omitnan'), 100*median(aF2(j), 'omitnan'), 100*max(aF2(j)));
end
i = strcmp(cs, 'tds+1'); e = abs(oc(i) - 100);
T('corpus TDS +1 st output within 15 cents', nnz(e > 15 | isnan(e)) == 0, '%d/%d clips off: %s', nnz(e > 15 | isnan(e)), nnz(i), strjoin(id(i)(e > 15 | isnan(e))', ' '));
e = abs(gd(i) - 100);
T('corpus TDS +1 st logged ratio within 15 cents', nnz(e > 15 | isnan(e)) == 0, '%d/%d clips off: %s', nnz(e > 15 | isnan(e)), nnz(i), strjoin(id(i)(e > 15 | isnan(e))', ' '));
end
