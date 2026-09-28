function s = replace(s, old, new)
% labrun compat (MATLAB replace) for char/cellstr.
if ischar(old), old = {old}; end
if ischar(new), new = repmat({new}, size(old)); end
if iscell(s), s = cellfun(@(x) replace(x, old, new), s, 'UniformOutput', false); return; end
for j = 1:numel(old), s = strrep(s, old{j}, new{j}); end
end
