function y = round(x, n, type)
% labrun compat: MATLAB's round(x, n) / round(x, n, 'significant') (Octave's round takes one argument).
if nargin == 1, y = builtin('round', x); return; end
if nargin > 2 && strcmpi(type, 'significant')
  d = n - ceil(log10(abs(x))); d(~isfinite(d)) = 0; y = builtin('round', x .* 10.^d) ./ 10.^d; return
end
y = builtin('round', x * 10^n) / 10^n;
end
