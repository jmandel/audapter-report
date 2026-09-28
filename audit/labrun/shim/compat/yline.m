function h = yline(varargin)
% labrun compat (display only).
a = varargin; if ~isempty(a) && isscalar(a{1}) && ishghandle(a{1}) && strcmp(get(a{1}, 'type'), 'axes'), ax = a{1}; a = a(2:end); else, ax = gca; end
y = a{1}; xl = get(ax, 'XLim'); hh = line(ax, repmat(xl(:), 1, numel(y)), [y(:) y(:)]');
if nargout, h = hh; end
end
