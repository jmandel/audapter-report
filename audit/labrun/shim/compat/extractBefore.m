function r = extractBefore(s, p)
if iscell(s), r = cellfun(@(x) extractBefore(x, p), s, 'UniformOutput', false); return; end
if isnumeric(p), r = s(1:p-1); return; end
k = strfind(s, p); if isempty(k), r = ''; else, r = s(1:k(1) - 1); end
end
