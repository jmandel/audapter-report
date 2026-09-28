function [m, i] = nanmin(x, varargin)
% labrun compat (statistics toolbox nanmin).
[m, i] = min(x, varargin{:});
end
