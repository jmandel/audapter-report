function h = viscircles(varargin)
% labrun compat (display only): an empty graphics group stands in for the circles.
ax = []; if nargin && isscalar(varargin{1}) && ishghandle(varargin{1}), ax = varargin{1}; end
if isempty(ax), ax = gca; end
h = hggroup(ax);
end
