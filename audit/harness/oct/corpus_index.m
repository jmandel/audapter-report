function M = corpus_index(root)
% Read the corpus manifest.tsv into a struct array (fields: id path sex age group source gt_file content).
if nargin < 1, root = '/a/audit/corpus'; end
fid = fopen(fullfile(root, 'manifest.tsv')); hdr = strsplit(fgetl(fid), "\t"); M = struct([]);
while true
  l = fgetl(fid); if ~ischar(l), break; end
  c = strsplit(l, "\t", "CollapseDelimiters", false); s = struct();
  for k = 1:numel(hdr), if k <= numel(c), s.(hdr{k}) = c{k}; else s.(hdr{k}) = ''; end, end
  s.file = fullfile(root, s.path); s.root = root;
  if isempty(M), M = s; else M(end+1) = s; end
end
fclose(fid);
end
