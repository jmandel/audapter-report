function lr_wrap_octave(names, dest)
% Make Octave's own m-file implementation of each name callable as lr_orig_<name> (copied into dest with the
% function renamed; its private/ helpers copied alongside), so a labrun shim of that name can extend it.
if ~exist(fullfile(dest, 'private'), 'dir'), mkdir(fullfile(dest, 'private')); end
for j = 1:numel(names)
  f = file_in_loadpath([names{j} '.m']);
  st = dbstack; %#ok
  all = which(names{j}, '-all'); f = '';
  for k = 1:numel(all), if strncmp(all{k}, '/usr/share/octave', 17), f = all{k}; break; end, end
  if isempty(f), error('labrun: no Octave implementation of %s', names{j}); end
  t = fileread(f);
  t = regexprep(t, ['(function[^\n=]*=\s*|function\s+)' names{j} '(\s*[\(\n])'], ['$1lr_orig_' names{j} '$2'], 'once');
  fid = fopen(fullfile(dest, ['lr_orig_' names{j} '.m']), 'w'); fwrite(fid, t); fclose(fid);
  pd = fullfile(fileparts(f), 'private');
  if exist(pd, 'dir'), system(sprintf('cp -n "%s"/* "%s"/ 2>/dev/null', pd, fullfile(dest, 'private'))); end
end
end
