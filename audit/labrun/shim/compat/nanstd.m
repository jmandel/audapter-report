function m = nanstd(x, varargin)
% labrun compat (statistics toolbox nanstd): std ignoring NaNs.
m = std(x, varargin{:}, "omitnan");
end
