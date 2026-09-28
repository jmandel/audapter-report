function [out, pos] = textwrap(a, b, varargin)
% labrun compat: textwrap(C, ncols) word-wraps a cell array of strings at ncols characters; the uicontrol form
% textwrap(h, C) returns C unwrapped (no rendering here).
if iscell(a) || ischar(a)
  C = cellstr(a); n = 75; if nargin > 1 && isnumeric(b), n = b; end
  out = {};
  for i = 1:numel(C)
    for para = strsplit(C{i}, "\n")
      w = strsplit(para{1}, ' '); line = '';
      for j = 1:numel(w)
        if isempty(line), cand = w{j}; else, cand = [line ' ' w{j}]; end
        if numel(cand) > n && ~isempty(line), out{end+1, 1} = line; line = w{j}; else, line = cand; end
      end
      out{end+1, 1} = line;
    end
  end
else
  if ischar(b), out = cellstr(b); else, out = b; end
end
pos = [0 0 1 1];
end
