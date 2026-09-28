function s = nansum(x, dim)
% labrun compat (statistics toolbox nansum).
x(isnan(x)) = 0; if nargin < 2, s = sum(x); else, s = sum(x, dim); end
end
