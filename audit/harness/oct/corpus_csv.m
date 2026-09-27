function [D, hdr] = corpus_csv(f)
% Read a numeric corpus CSV ('#' comment lines, one header line, empty cells -> NaN).
fid = fopen(f); l = fgetl(fid); while l(1) == '#', l = fgetl(fid); end
hdr = strsplit(l, ','); D = [];
while true
  l = fgetl(fid); if ~ischar(l), break; end
  c = strsplit(l, ',', 'CollapseDelimiters', false); v = nan(1, numel(hdr));
  for k = 1:min(numel(c), numel(hdr)), if ~isempty(c{k}), v(k) = str2double(c{k}); end, end
  D(end+1, :) = v;
end
fclose(fid);
end
