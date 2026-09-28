function r = extractAfter(s, p)
if iscell(s), r = cellfun(@(x) extractAfter(x, p), s, 'UniformOutput', false); return; end
if isnumeric(p), r = s(p+1:end); return; end
k = strfind(s, p); if isempty(k), r = ''; else, r = s(k(1) + numel(p):end); end
end
