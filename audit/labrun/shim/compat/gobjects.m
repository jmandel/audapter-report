function h = gobjects(varargin)
% labrun compat: placeholder graphics-handle array (zeros; later filled with real handles by the caller).
if nargin == 0, h = zeros(0); else, h = zeros(varargin{:}); end
end
