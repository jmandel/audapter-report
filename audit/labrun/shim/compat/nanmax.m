function [m, i] = nanmax(x, varargin)
% labrun compat (statistics toolbox nanmax).
[m, i] = max(x, varargin{:});
end
