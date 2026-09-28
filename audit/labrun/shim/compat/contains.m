function tf = contains(str, pat, varargin)
% labrun compat (MATLAB contains): char/cellstr str, char/cellstr pat, optional 'IgnoreCase'.
ic = numel(varargin) >= 2 && strcmpi(varargin{1}, 'IgnoreCase') && varargin{2};
if ischar(pat), pat = {pat}; end
one = @(s) any(cellfun(@(p) ~isempty(lr_strfind(s, p, ic)), pat));
if ischar(str), tf = one(str); else, tf = cellfun(one, str); end
end
function r = lr_strfind(s, p, ic)
if ic, r = strfind(lower(s), lower(p)); else, r = strfind(s, p); end
end
