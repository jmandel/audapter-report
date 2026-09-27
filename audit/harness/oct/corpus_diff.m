% Compare corpus_diff_run.m results: blab vs upstream (bit-exact per array), plus NaN/level/clipping checks.
A = load('/h/oct/out/corpus_diff_upstream.mat'); B = load('/h/oct/out/corpus_diff_blab.mat'); A = A.R; B = B.R;
K = fieldnames(B); sc = regexprep(K, '^.*__', ''); scs = unique(sc)';
F = {'signalOut', 'fmts', 'sfmts', 'ost_stat', 'rms'};
printf('\n== blab vs upstream 2.1.5 over the corpus: clips whose outputs differ (per scenario / array)\n');
for s = scs
  i = find(strcmp(sc, s{1}))'; nd = zeros(1, numel(F)); err = 0; ids = {};
  for k = i
    a = A.(K{k}); b = B.(K{k});
    if isfield(a, 'error') || isfield(b, 'error'), err = err + 1; continue; end
    dd = cellfun(@(f) isfield(a, f) && isfield(b, f) && ~strcmp(a.(f), b.(f)), F); nd = nd + dd;
    if any(dd), ids{end+1} = regexprep(K{k}, '__.*$', ''); end
  end
  printf('  %-11s n=%2d errors %d | differ: signalOut %2d fmts %2d sfmts %2d ost_stat %2d rms %2d\n', s{1}, numel(i), err, nd);
  if ~isempty(ids) && numel(ids) <= 12, printf('      %s\n', strjoin(ids, ' ')); end
  if strcmp(s{1}, 'field_region')
    na = sum(arrayfun(@(k) A.(K{k}).nshift, i)); nb = sum(arrayfun(@(k) B.(K{k}).nshift, i)); nt = sum(arrayfun(@(k) B.(K{k}).ntrack, i));
    printf('      shifted frames: upstream %d, blab %d (%+.0f%%) of %d tracked frames\n', na, nb, 100*(nb - na)/max(na, 1), nt);
    dr = arrayfun(@(k) (B.(K{k}).nshift - A.(K{k}).nshift) / max(1, A.(K{k}).nshift), i);
    [~, o] = sort(-abs(dr)); for k = i(o(1:min(5, end))), printf('      %-34s upstream %4d blab %4d\n', regexprep(K{k}, '__.*$', ''), A.(K{k}).nshift, B.(K{k}).nshift); end
    T(['corpus diff ' s{1} ': differences confined to sfmts/signalOut (dropout fix)'], nd(2) == 0 && nd(4) == 0 && nd(5) == 0, '%d/%d clips differ (expected: blab re-arms the shift when formants re-enter the region)', numel(ids), numel(i));
  else
    T(['corpus diff ' s{1} ': blab == upstream bit-exact'], isempty(ids) && err == 0, '%d/%d clips differ, %d errors', numel(ids), numel(i), err);
  end
end
printf('\n== output sanity over the corpus (blab): non-finite values, peaks >= 1.0, gain > +10 dB\n');
bad = {};
for k = 1:numel(K)
  b = B.(K{k}); if isfield(b, 'error'), bad{end+1} = [K{k} ' ERROR ' b.error]; continue; end
  if b.nan > 0 || b.peak >= 1 || b.gain_db > 10, bad{end+1} = sprintf('%s nonfinite %d peak %.2f gain %+.1f dB', K{k}, b.nan, b.peak, b.gain_db); end
end
printf('  %s\n', bad{:});
T('corpus sanity: no NaN/Inf, no clipping, no > +10 dB gain', isempty(bad), '%d clip-scenarios flagged', numel(bad));
