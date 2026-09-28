function lr_plan_files(files, then)
% plan.pre helper: write stand-in files ({path, text; ...}), then run an optional further hook.
for j = 1:size(files, 1)
  d = regexprep(files{j, 1}, '[\\/][^\\/]*$', ''); if ~isempty(d) && ~exist(d, 'dir'), mkdir(d); end
  fid = fopen(files{j, 1}, 'w'); fwrite(fid, files{j, 2}); fclose(fid);
  lr_log_op(struct('op', 'plan:file', 'path', files{j, 1}));
end
if nargin > 1 && ~isempty(then), then(); end
end
