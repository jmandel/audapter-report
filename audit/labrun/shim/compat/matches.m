function tf = matches(str, pat, varargin)
% labrun compat (MATLAB matches): whole-string match against one or more patterns.
ic = numel(varargin) >= 2 && strcmpi(varargin{1}, 'IgnoreCase') && varargin{2};
if ischar(pat), pat = {pat}; end
f = @strcmp; if ic, f = @strcmpi; end
one = @(s) any(cellfun(@(p) f(s, p), pat));
if ischar(str), tf = one(str); else, tf = cellfun(one, str); end
end
