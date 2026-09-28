function T = readtable(f, varargin)
% labrun compat (minimal MATLAB readtable) for delimited text with a header row: returns a struct with one field
% per column (numeric column vectors where every value parses, else cellstr), so T.name access works. Options:
% 'Delimiter', 'TreatAsMissing' (-> NaN), 'ReadVariableNames'. Not a table object (no T(i,:) indexing).
o = struct('delimiter', ',', 'treatasmissing', {{}}, 'readvariablenames', true);
for j = 1:2:numel(varargin), o.(lower(varargin{j})) = varargin{j + 1}; end
if ischar(o.treatasmissing), o.treatasmissing = {o.treatasmissing}; end
L = strsplit(regexprep(fileread(f), '\r', ''), "\n"); L = L(~cellfun(@isempty, L));
if o.readvariablenames, hdr = strtrim(strsplit(L{1}, o.delimiter)); L = L(2:end); else, hdr = arrayfun(@(k) sprintf('Var%d', k), 1:numel(strsplit(L{1}, o.delimiter)), 'UniformOutput', false); end
hdr = regexprep(hdr, '\W', '_');
C = cellfun(@(l) strtrim(strsplit(l, o.delimiter)), L, 'UniformOutput', false);
T = struct();
for c = 1:numel(hdr)
  col = cellfun(@(r) ifelse_(numel(r) >= c, r, c), C, 'UniformOutput', false);
  col(ismember(col, o.treatasmissing)) = {'NaN'};
  v = str2double(col);
  if all(~isnan(v) | strcmpi(col, 'NaN')), T.(hdr{c}) = v(:); else, T.(hdr{c}) = col(:); end
end
end
function x = ifelse_(ok, r, c)
if ok, x = r{c}; else, x = ''; end
end
