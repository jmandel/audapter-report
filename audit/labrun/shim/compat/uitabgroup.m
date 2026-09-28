function h = uitabgroup(varargin)
% labrun compat: Octave has no tab groups; a uipanel stands in (tabs become stacked panels). GUI layout only.
a = varargin; par = []; if ~isempty(a) && ~ischar(a{1}), par = a{1}; a = a(2:end); end
keep = {};
for j = 1:2:numel(a) - 1, if ~any(strcmpi(a{j}, {'SelectionChangedFcn', 'TabLocation', 'SelectedTab'})), keep(end+1:end+2) = a(j:j+1); end, end
if isempty(par), h = uipanel(keep{:}); else, h = uipanel(par, keep{:}); end
end
