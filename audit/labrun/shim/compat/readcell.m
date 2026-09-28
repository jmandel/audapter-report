function c = readcell(f, varargin)
% labrun compat (MATLAB readcell) for delimited text files: one cell per field, numbers converted.
% Spreadsheets (.xls/.xlsx) are not supported (error names the file so a plan can supply a text copy).
[~, ~, e] = fileparts(f);
if any(strcmpi(e, {'.xls', '.xlsx'}))
  if exist([f '.labrun.txt'], 'file'), f = [f '.labrun.txt']; else, error('labrun readcell: spreadsheet %s not supported (no %s.labrun.txt)', f, f); end
end
L = strsplit(regexprep(fileread(f), '\r', ''), "\n"); L = L(~cellfun(@isempty, L));
rows = cellfun(@(l) strsplit(l, {',', "\t"}), L, 'UniformOutput', false);
n = max(cellfun(@numel, rows)); c = cell(numel(rows), n); c(:) = {missing_()};
for i = 1:numel(rows), for j = 1:numel(rows{i}), v = str2double(rows{i}{j}); if isfinite(v), c{i, j} = v; else, c{i, j} = rows{i}{j}; end, end, end
end
function m = missing_()
m = [];
end
