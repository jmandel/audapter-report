function s = strip(s, side, ch)
% labrun compat (MATLAB strip) for char and cellstr.
if nargin < 2, side = 'both'; end
if iscell(s), s = cellfun(@(x) strip(x, side), s, 'UniformOutput', false); return; end
switch lower(side)
  case 'left', s = regexprep(s, '^\s+', '');
  case 'right', s = regexprep(s, '\s+$', '');
  otherwise, s = strtrim(s);
end
end
