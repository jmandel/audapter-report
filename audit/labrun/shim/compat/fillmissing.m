function B = fillmissing(A, method, varargin)
% labrun compat (MATLAB fillmissing) for numeric vectors/matrices along dim 1 (rows: along the row): NaNs replaced by
% 'nearest' (nearest non-NaN; ties to the next one, as MATLAB), 'previous', 'next', 'linear' (interior interpolation,
% nearest at the ends) or 'constant' (value in varargin{1}). Columns with no non-NaN value are left unchanged.
if isrow(A) && ~isscalar(A), B = fillmissing(A(:), method, varargin{:})'; return; end
B = A;
for c = 1:size(A, 2)
  x = A(:, c); ok = find(~isnan(x)); bad = find(isnan(x));
  if isempty(ok) || isempty(bad), continue; end
  switch lower(method)
    case 'constant', x(bad) = varargin{1};
    case 'previous', for i = bad', p = ok(ok < i); if ~isempty(p), x(i) = x(p(end)); end, end
    case 'next', for i = bad', n = ok(ok > i); if ~isempty(n), x(i) = x(n(1)); end, end
    case 'nearest', for i = bad', [~, j] = min(abs(ok - i) - 0.5 * (ok > i)); x(i) = A(ok(j), c); end
    case 'linear'
      x(bad) = interp1(ok, x(ok), bad, 'linear');
      x(bad(bad < ok(1))) = x(ok(1)); x(bad(bad > ok(end))) = x(ok(end));
    otherwise, error('labrun compat fillmissing: method %s not implemented', method);
  end
  B(:, c) = x;
end
end
