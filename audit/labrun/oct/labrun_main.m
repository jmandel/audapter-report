% labrun entry point (runs inside the audapter-labrun container; see ../labrun).
% Environment: LR_PLAN (plan script), LR_OUT (output dir), LR_LIB (labrun dir), LR_SRC (lab sources root, ro),
% LR_WORK (writable sandbox), LR_MEX (real MEX), LR_HARNESS (audit/harness/oct for synth/estimators).
% Plan fields used here: name, repos (lab repos copied into the sandbox and put on the path),
% exptDir (sandbox-relative dir put first on the path and used as cwd), paths (optional explicit genpath roots
% instead of whole repos), entry (function name), args (cell) or argsFn (@() cell, evaluated after setup),
% pre (optional @() hook run before the entry, e.g. to seed an expt file), and the lr_init options.
more off; warning('off', 'all'); pkg load signal;
save_default_options('-v7');   % MATLAB's binary .mat format (Octave's default is text)
graphics_toolkit('gnuplot'); set(0, 'defaultfigurevisible', 'off');
addpath(fullfile(getenv('LR_LIB'), 'shim', 'core'));
src = getenv('LR_SRC'); work = getenv('LR_WORK'); out = getenv('LR_OUT'); lib = getenv('LR_LIB');
plan = struct(); run(getenv('LR_PLAN'));
if ~isfield(plan, 'repos'), plan.repos = {}; end
if ~isfield(plan, 'paths'), plan.paths = {}; end
repos = unique([plan.repos, {'free-speech', 'commonmcode', 'wave_viewer'}], 'stable');
% --- sandbox: writable copies of the lab repos (the lab code writes working OST/PCF copies into its repos) ---
mkdir(fullfile(work, 'repos'));
for j = 1:numel(repos)
  s = ''; for base = {'other/blab-experiments', 'other/blab-private'}
    if exist(fullfile(src, base{1}, repos{j}), 'dir'), s = fullfile(src, base{1}, repos{j}); break; end, end
  if isempty(s), error('labrun: lab repo %s not found', repos{j}); end
  system(sprintf('cp -r "%s" "%s"', s, fullfile(work, 'repos', repos{j})));
end
system(sprintf('cp -r "%s" "%s"', fullfile(src, 'blab', 'audapter_matlab'), fullfile(work, 'repos', 'audapter_matlab')));
% load-time transformations recorded by earlier attempts of this run (tools/transform.py; see README)
tlist = fullfile(out, 'transforms.list'); tfiles = {};
if exist(tlist, 'file'), tfiles = strsplit(strtrim(fileread(tlist)), "\n"); tfiles = tfiles(~cellfun(@isempty, tfiles)); end
tlog = fopen(fullfile(out, 'transforms.tsv'), 'w'); fprintf(tlog, 'file\tline\tbefore\tafter\n');
for j = 1:numel(tfiles)
  [~, o] = system(sprintf('python3 "%s" "%s"', fullfile(lib, 'tools', 'transform.py'), fullfile(work, 'repos', tfiles{j})));
  L = strsplit(strtrim(o), "\n"); for k = 1:numel(L), if ~isempty(L{k}), fprintf(tlog, '%s\t%s\n', tfiles{j}, L{k}); end, end
end
fclose(tlog);
% Repository roots the lab code locates with free-speech get_gitPath(repo): each repo is identified by a marker file
% (read from get_gitPath.m itself). An experiment folder the runner addresses as fullfile(get_gitPath(repo), name)
% -- the lab's layout, where a published experiment folder lives inside that (unpublished) repo -- is placed there
% as a copy of the plan's experiment folder when that repo is not part of the run (logged in stand-ins.tsv), and the
% repo root gets an empty marker file. plan.layout = {dest, src; ...} adds explicit placements.
gt = fileread(fullfile(work, 'repos', 'free-speech', 'experiment_helpers', 'get_gitPath.m'));
mk = regexp(gt, 'case\s+''([^'']+)''\s*[\r\n]+\s*mfilename\s*=\s*''([^'']+)''', 'tokens');
markers = cell(0, 2); for j = 1:numel(mk), markers(end+1, :) = mk{j}; end
sfid = fopen(fullfile(out, 'stand-ins.tsv'), 'w'); fprintf(sfid, 'kind\tpath\tsource\n');
lay = cell(0, 2); if isfield(plan, 'layout'), lay = plan.layout; end
if ~isfield(plan, 'autoLayout') || plan.autoLayout
  ed = fullfile(work, 'repos', plan.exptDir); names = {};
  for f = dir(fullfile(ed, '*.m'))'
    t = fileread(fullfile(ed, f.name)); t(t > 127) = ' ';
    tk = regexp(t, 'expt\.name\s*=\s*''([^'']+)''', 'tokens'); names = [names, cellfun(@(c) c{1}, tk, 'UniformOutput', false)];
  end
  for f = dir(fullfile(ed, '*.m'))'
    t = fileread(fullfile(ed, f.name)); t(t > 127) = ' ';
    for c = regexp(t, 'get_gitPath\(\s*''([^'']+)''\s*\)\s*,\s*(''[^'']+''|expt\.name)', 'tokens')
      r = c{1}{1}; if any(strcmp(r, repos)), continue; end
      if c{1}{2}(1) == '''', subs = {c{1}{2}(2:end-1)}; else, subs = unique(names); end
      for k = 1:numel(subs), if ~any(strcmp(lay(:, 1), fullfile(r, subs{k}))), lay(end+1, :) = {fullfile(r, subs{k}), plan.exptDir}; end, end
    end
  end
end
for j = 1:size(lay, 1)
  d = fullfile(work, 'repos', lay{j, 1});
  if exist(d, 'dir'), continue; end
  mkdir(fileparts(d)); system(sprintf('cp -r "%s" "%s"', fullfile(work, 'repos', lay{j, 2}), d));
  fprintf(sfid, 'experiment-folder\t%s\t%s\n', lay{j, 1}, lay{j, 2});
  if strcmp(lay{j, 2}, plan.exptDir) && ~exist('exptDirRun', 'var'), exptDirRun = lay{j, 1}; end
end
if exist('exptDirRun', 'var'), plan.exptDir = exptDirRun; end   % run from the placed copy (it gets the Working files)
for j = 1:size(markers, 1)
  r = fullfile(work, 'repos', markers{j, 1});
  if ~exist(r, 'dir'), continue; end
  [~, hit] = system(sprintf('find "%s" -name "%s" | head -1', r, markers{j, 2}));
  if isempty(strtrim(hit))
    fid = fopen(fullfile(r, markers{j, 2}), 'w'); fprintf(fid, '%% labrun marker so get_gitPath can locate this folder\n'); fclose(fid);
    plan.paths{end+1} = markers{j, 1};
    fprintf(sfid, 'repo-marker\t%s\t\n', fullfile(markers{j, 1}, markers{j, 2}));
  end
end
% OST/PCF "Working" copies: the lab's runners load <name>Working.ost/.pcf, which refreshWorkingCopy makes from
% <name>Master.*; on a rig a Working copy is left over from earlier sessions. Where none exists, one is made from
% the Master (logged in stand-ins.tsv).
[~, lst] = system(sprintf('cd "%s" && find . -name "*Master.ost" -o -name "*Master.pcf"', fullfile(work, 'repos')));
for f = strsplit(strtrim(lst), "\n")
  if isempty(f{1}), continue; end
  w = strrep(f{1}, 'Master.', 'Working.');
  if ~exist(fullfile(work, 'repos', w), 'file'), copyfile(fullfile(work, 'repos', f{1}), fullfile(work, 'repos', w)); fprintf(sfid, 'working-copy\t%s\t%s\n', w(3:end), f{1}(3:end)); end
end
fclose(sfid);
mkdir(fullfile(work, 'mex')); copyfile(getenv('LR_MEX'), fullfile(work, 'mex', 'AudapterReal.mex'));
mkdir(fullfile(work, 'lib'));
for f = {'synth_vowel.m', 'est_formants.m', 'est_f0.m'}, copyfile(fullfile(getenv('LR_HARNESS'), f{1}), fullfile(work, 'lib', f{1})); end
% --- path: (front) labrun shims, MEX; expt dir; repos (genpath); audapter_matlab mcode; (back) analysis lib ---
addpath(fullfile(work, 'repos', 'audapter_matlab', 'mcode'));
roots = plan.paths; if isempty(roots) || all(ismember(roots, markers(:, 1))), roots = [repos, roots]; end
roots = unique(roots, 'stable');
for j = numel(roots):-1:1
  if any(strcmp(roots{j}, markers(:, 1))) && ~any(strcmp(roots{j}, repos)), addpath(fullfile(work, 'repos', roots{j}));   % marker-only root
  else, addpath(lr_genpath(fullfile(work, 'repos', roots{j}))); end
end
exptDir = fullfile(work, 'repos', plan.exptDir); addpath(exptDir);
addpath(fullfile(work, 'lib'), '-end');
for s = {'thirdparty', 'compat', 'env', 'ptb', 'core', 'audapter'}, addpath(fullfile(lib, 'shim', s{1})); end
addpath(fullfile(lib, 'oct'), '-end');
addpath(fullfile(work, 'mex'));
% plan.stubs = {function name, m-code; ...}: stand-ins for lab functions that cannot run here (e.g. a GUIDE .fig GUI,
% which Octave cannot load), written to a folder ahead of the lab code on the path and logged in stand-ins.tsv
if isfield(plan, 'stubs')
  mkdir(fullfile(work, 'stubs'));
  sfid = fopen(fullfile(out, 'stand-ins.tsv'), 'a');
  for j = 1:size(plan.stubs, 1)
    fid = fopen(fullfile(work, 'stubs', [plan.stubs{j, 1} '.m']), 'w'); fprintf(fid, '%s\n', plan.stubs{j, 2}); fclose(fid);
    fprintf(sfid, 'function-stub\t%s\t%s\n', plan.stubs{j, 1}, strrep(plan.stubs{j, 2}, "\n", ' '));
  end
  fclose(sfid); addpath(fullfile(work, 'stubs'));
end
lr_wrap_octave({'text', 'uicontrol', 'delete'}, fullfile(work, 'octorig')); addpath(fullfile(work, 'octorig'), '-end');
printf('labrun: %s: Audapter -> %s; AudapterIO -> %s\n', plan.name, which('Audapter'), which('AudapterIO'));
% --- run ---
set(0, 'DefaultFigureCreateFcn', @lr_fig_created);
lr_init(plan, out);
global LR
cd(exptDir);
% Windows paths: the container preloads winpath.so, which maps 'C:\...' to $LR_WINROOT/C/... and '\\server\...' to
% $LR_WINROOT/unc/server/... . The lab's standard checkout location C:\Users\Public\Documents\software\<repo> points
% at the sandbox copies. plan.links = {Windows path, sandbox-relative target; ...} adds rig-specific files.
wr = getenv('LR_WINROOT'); sw = fullfile(wr, 'C', 'Users', 'Public', 'Documents', 'software'); mkdir(sw);
mkdir(fullfile(wr, 'C', 'Users', 'Public', 'Documents', 'experiments'));
mkdir(fullfile(wr, 'C', 'Users', 'Public', 'Desktop')); symlink('/usr/bin/praat', fullfile(wr, 'C', 'Users', 'Public', 'Desktop', 'Praat.exe'));   % the lab's Praat location
for r = dir(fullfile(work, 'repos'))'
  if r.name(1) ~= '.', symlink(fullfile(work, 'repos', r.name), fullfile(sw, r.name)); end
end
if isfield(plan, 'links')
  for j = 1:size(plan.links, 1)
    mkdir(regexprep(plan.links{j, 1}, '[\\/][^\\/]*$', '')); symlink(fullfile(work, 'repos', plan.links{j, 2}), plan.links{j, 1});
  end
end
if isfield(plan, 'pre') && is_function_handle(plan.pre), plan.pre(); end
if isfield(plan, 'argsFn'), args = plan.argsFn(); elseif isfield(plan, 'args'), args = plan.args; else, args = {}; end
status = 'completed'; errmsg = ''; errstack = {};
if ~isempty(getenv('LR_PROFILE')), profile on; end
try
  nout = 0; try, nout = nargout(plan.entry); catch, end
  if nout > 0, ret = cell(1, 1); [ret{1}] = feval(plan.entry, args{:}); else, feval(plan.entry, args{:}); end
catch err
  status = 'error'; errmsg = err.message;
  for j = 1:numel(err.stack), errstack{end+1} = sprintf('%s:%d (%s)', err.stack(j).file, err.stack(j).line, err.stack(j).name); end
  printf('labrun: ERROR %s\n', errmsg); printf('  at %s\n', errstack{:});
  % MATLAB graphics dot notation Octave cannot run: transform the failing file at load time and retry
  if ~isempty(regexp(errmsg, '(scalar|matrix|complex scalar) cannot be indexed with \.|invalid use of a N_-D array|scalar cannot be indexed with \{', 'once')) && ~isempty(err.stack)
    ef = err.stack(1).file; pre = [fullfile(work, 'repos') '/'];
    if strncmp(ef, pre, numel(pre)) && ~any(strcmp(tfiles, ef(numel(pre)+1:end)))
      fid = fopen(tlist, 'a'); fprintf(fid, '%s\n', ef(numel(pre)+1:end)); fclose(fid);
      status = 'retry'; printf('labrun: will transform %s (graphics dot notation) and retry\n', ef(numel(pre)+1:end));
    end
  end
end
if ~isempty(getenv('LR_PROFILE')), profile off; T = profile('info'); [~, o] = sort([T.FunctionTable.TotalTime], 'descend'); for j = o(1:min(25, end)), printf('%8.3f s %8d calls  %s\n', T.FunctionTable(j).TotalTime, T.FunctionTable(j).NumCalls, T.FunctionTable(j).FunctionName); end, end
if lr_is_running(), lr_device_stop(); end
lr_finish(status, errmsg, errstack, work);
exit(0);
