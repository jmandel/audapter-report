function lr_finish(status, errmsg, errstack, work)
% Close logs, collect the lab's own saved files, write run.json and the per-trial summary.
global LR
wall = builtin('time') - LR.wall0;
fclose(LR.oplog); fclose(LR.timeline); fclose(LR.playlog); LR.echo_ops = false; LR.oplog = -1; LR.timeline = -1; LR.playlog = -1;
% close the lab's figures without running their close callbacks (a GUI's "save and exit?" dialog at teardown)
try, f = findall(0, 'type', 'figure'); set(f, 'CloseRequestFcn', 'closereq'); delete(f); catch, end
% the lab's own saved data: every .mat written in the sandbox during the run (expt.mat, data.mat, trial files ...)
[~, lst] = system(sprintf('cd "%s" && find . -newer "%s" \\( -type f -o -type l \\) \\( -name "*.mat" -o -name "*Working.ost" -o -name "*Working.pcf" -o -name "*.txt" \\) 2>/dev/null', work, fullfile(work, 'mex', 'AudapterReal.mex')));
files = strsplit(strtrim(lst), "\n"); files = files(~cellfun(@isempty, files));
wr = getenv('LR_WINROOT');   % data the lab code wrote to Windows paths (C:\..., \\server\...)
[~, lw] = system(sprintf('cd "%s" && find . -type f \\( -name "*.mat" -o -name "*.txt" -o -name "*.wav" -o -name "*.csv" \\) -not -path "./C/Users/Public/Documents/software/*" 2>/dev/null', wr));
wfiles = strsplit(strtrim(lw), "\n"); wfiles = wfiles(~cellfun(@isempty, wfiles));
labdir = fullfile(LR.outdir, 'labdata'); saved = {};
srcs = [cellfun(@(f) fullfile(work, f), files, 'UniformOutput', false), cellfun(@(f) fullfile(wr, f), wfiles, 'UniformOutput', false)];
rels = [cellfun(@(f) ['sandbox/' f(3:end)], files, 'UniformOutput', false), cellfun(@(f) ['win/' f(3:end)], wfiles, 'UniformOutput', false)];
for j = 1:numel(srcs)
  s = srcs{j}; rel = regexprep(rels{j}, '[\\:]', '_');
  d = fullfile(labdir, fileparts(rel)); if ~exist(d, 'dir'), mkdir(d); end
  q = @(x) ['''' strrep(x, '''', '''\''''') ''''];
  system(['cp ' q(s) ' ' q(fullfile(labdir, rel))]); saved{end+1} = rel;
end
proc = LR.trialIndex(strcmp({LR.trialIndex.mode}, 'proc'));
vsec = LR.vclock; audio = 0; if ~isempty(proc), audio = sum([proc.t1] - [proc.t0]); end
R = struct('name', LR.plan.name, 'status', status, 'error', errmsg, 'errstack', {errstack}, ...
  'ntrials_started', LR.ntrial, 'ntrials_proc', numel(proc), 'virtual_s', vsec, 'audio_s', audio, 'wall_s', wall, ...
  'speed_virtual_per_wall', vsec / max(wall, 1e-9), 'speed_audio_per_wall', audio / max(wall, 1e-9), ...
  'notes', {LR.notes}, 'prompts', {LR.asked.keys}, 'prompt_counts', LR.asked.count, 'lab_files', {saved}, ...
  'nplays', LR.nplay, 'counts', LR.counts);
fid = fopen(fullfile(LR.outdir, 'run.json'), 'w'); fprintf(fid, '%s', jsonencode(R, 'PrettyPrint', true)); fclose(fid);
printf('labrun: %s %s: %d device starts (%d audio trials), %.1f s virtual (%.1f s audio) in %.1f s wall = %.1fx\n', ...
  LR.plan.name, status, LR.ntrial, numel(proc), vsec, audio, wall, vsec / max(wall, 1e-9));
try
  labrun_summary(LR.outdir);
catch e
  printf('labrun: summary failed: %s\n', e.message); for j = 1:numel(e.stack), printf('  at %s:%d\n', e.stack(j).name, e.stack(j).line); end
end
end
