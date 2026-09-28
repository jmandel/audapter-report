function n = strlength(s)
if ischar(s), n = size(s, 2); else, n = cellfun(@(x) size(x, 2), s); end
end
