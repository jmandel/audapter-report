function tf = isoutlier(A, method, varargin)
% labrun compat (MATLAB isoutlier) for vectors/matrices along dim 1 (or the first non-singleton dim):
% 'median' (default): |A - median| > 3 * scaled MAD (1.4826 * MAD); 'mean': > 3 SD; 'quartiles': outside
% 1.5 IQR; 'grubbs': iterative Grubbs test at alpha 0.05. NaNs are never outliers.
if nargin < 2 || isempty(method), method = 'median'; end
if isrow(A) && ~isscalar(A), tf = isoutlier(A(:), method, varargin{:})'; return; end
tf = false(size(A));
for c = 1:size(A, 2)
  x = A(:, c); ok = ~isnan(x);
  switch lower(method)
    case 'median', m = median(x(ok)); s = 1.482602218505602 * median(abs(x(ok) - m)); tf(:, c) = ok & abs(x - m) > 3 * s;
    case 'mean', m = mean(x(ok)); s = std(x(ok)); tf(:, c) = ok & abs(x - m) > 3 * s;
    case 'quartiles', q = quantile(x(ok), [0.25 0.75]); r = q(2) - q(1); tf(:, c) = ok & (x < q(1) - 1.5 * r | x > q(2) + 1.5 * r);
    case 'grubbs'
      idx = find(ok);
      while numel(idx) > 2
        y = x(idx); n = numel(y); [g, i] = max(abs(y - mean(y)) / std(y));
        t = tinv(1 - 0.05 / (2 * n), n - 2); gc = (n - 1) / sqrt(n) * sqrt(t^2 / (n - 2 + t^2));
        if g > gc, tf(idx(i), c) = true; idx(i) = []; else, break; end
      end
    otherwise, error('labrun isoutlier: method %s not implemented', method);
  end
end
end
