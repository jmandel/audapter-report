function d = datetime(varargin)
% labrun compat (minimal): Octave has no datetime class. datetime('now'|'today', 'Format', f) returns the
% virtual-clock time as a char string in (an approximation of) that format; datetime(text, ...) returns the text.
% Arithmetic on the result (e.g. + minutes(5)) is not supported.
a = 'now'; if nargin >= 1, a = varargin{1}; end
fmt = 'dd-mmm-yyyy HH:MM:SS';
for j = 2:2:numel(varargin) - 1
  if strcmpi(varargin{j}, 'Format')
    fmt = varargin{j + 1};
    fmt = strrep(strrep(strrep(strrep(fmt, 'mm', 'MIN'), 'MM', 'mm'), 'MIN', 'MM'), 'ms', 'FFF');
    fmt = regexprep(fmt, '(?<![yY])y(?![yY])', 'yyyy'); fmt = strrep(fmt, 'MMMM', 'mmmm'); fmt = strrep(fmt, 'MMM', 'mmm');
  end
end
if ischar(a) && any(strcmpi(a, {'now', 'today'}))
  t = now(); if strcmpi(a, 'today'), t = floor(t); end
  d = datestr(t, fmt);
else
  d = a;
end
end
