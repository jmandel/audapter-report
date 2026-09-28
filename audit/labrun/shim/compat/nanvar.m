function m = nanvar(x, varargin)
% labrun compat (statistics toolbox nanvar): var ignoring NaNs.
m = var(x, varargin{:}, "omitnan");
end
