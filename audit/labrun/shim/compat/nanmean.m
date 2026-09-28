function m = nanmean(x, varargin)
% labrun compat (statistics toolbox nanmean): mean ignoring NaNs.
m = mean(x, varargin{:}, "omitnan");
end
