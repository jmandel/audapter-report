function s = pad(s, n, side)
if nargin < 3, side = 'right'; end
if iscell(s)
  if nargin < 2 || isempty(n), n = max(cellfun(@numel, s)); end
  s = cellfun(@(x) pad(x, n, side), s, 'UniformOutput', false); return
end
k = max(0, n - numel(s));
if strcmpi(side, 'left'), s = [repmat(' ', 1, k) s]; else, s = [s repmat(' ', 1, k)]; end
end
