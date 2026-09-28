function n = count(s, p)
if ischar(p), p = {p}; end
one = @(x) sum(cellfun(@(q) numel(strfind(x, q)), p));
if ischar(s), n = one(s); else, n = cellfun(one, s); end
end
