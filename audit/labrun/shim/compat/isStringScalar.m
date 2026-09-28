function r = isStringScalar(s)
% labrun compat: Octave has no string class; char row vectors count as string scalars.
r = ischar(s) && (isrow(s) || isempty(s));
end
