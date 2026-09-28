function h = uitab(varargin)
% labrun compat: a tab is a uipanel inside the stand-in tab group (GUI layout only).
a = varargin; par = []; if ~isempty(a) && ~ischar(a{1}), par = a{1}; a = a(2:end); end
keep = {};
for j = 1:2:numel(a) - 1, if ~any(strcmpi(a{j}, {'ButtonDownFcn'})), keep(end+1:end+2) = a(j:j+1); end, end
if isempty(par), h = uipanel(keep{:}); else, h = uipanel(par, keep{:}); end
end
