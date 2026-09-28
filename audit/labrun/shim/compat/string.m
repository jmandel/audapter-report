function s = string(x)
% labrun compat: Octave has no string class. Numbers -> char (num2str), cellstr stays cellstr, char stays char.
% (Semantics differ from MATLAB strings, e.g. "+" concatenation; recorded as an approximation.)
if ischar(x) || iscellstr(x), s = x;
elseif isnumeric(x) || islogical(x)
  if isscalar(x), s = num2str(x); else, s = arrayfun(@num2str, x, 'UniformOutput', false); end
else, s = char(x);
end
end
