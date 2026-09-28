function h = xline(varargin)
% labrun compat (display only).
a = varargin; if ~isempty(a) && isscalar(a{1}) && ishghandle(a{1}) && strcmp(get(a{1}, 'type'), 'axes'), ax = a{1}; a = a(2:end); else, ax = gca; end
x = a{1}; yl = get(ax, 'YLim'); hh = line(ax, [x(:) x(:)]', repmat(yl(:), 1, numel(x)));
if nargout, h = hh; end
end
