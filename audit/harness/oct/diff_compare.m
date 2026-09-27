A = load('/h/oct/out/diff_upstream.mat'); B = load('/h/oct/out/diff_blab.mat'); A = A.R; B = B.R;
for f = fieldnames(A)'
  a = A.(f{1}); b = B.(f{1});
  if isfield(a, 'error') || isfield(b, 'error'), printf('%-16s upstream err: %s | blab err: %s\n', f{1}, getfield(a,'error'), getfield(b,'error')); continue; end
  fl = {'signalOut', 'fmts', 'sfmts', 'ost_stat', 'rms'};
  s = sprintf('%-16s', f{1});
  for k = 1:numel(fl)
    x = a.(fl{k}); y = b.(fl{k});
    if ~isequal(size(x), size(y)), s = [s sprintf(' %s:size %s/%s', fl{k}, mat2str(size(x)), mat2str(size(y)))]; continue; end
    dd = abs(x(:) - y(:)); if max(dd) == 0, t = 'same'; else t = sprintf('max%.3g(n=%d)', max(dd), nnz(dd > 1e-9)); end; s = [s sprintf(' %s:%s', fl{k}, t)];
  end
  printf('%s\n', s);
end
