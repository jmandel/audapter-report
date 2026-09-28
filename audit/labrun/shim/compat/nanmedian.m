function m = nanmedian(x, varargin)
% labrun compat (statistics toolbox nanmedian): median ignoring NaNs.
m = median(x, varargin{:}, "omitnan");
end
