function lr_init(plan, outdir)
% Initialise the labrun state (global LR): virtual clock, logs, plan defaults, AudapterIO parameter map.
global LR
LR = struct();
d = struct('name', 'run', 'seed', 1, 'gender', '', 'answers', {cell(0, 2)}, 'gui', {cell(0, 2)}, ...
  'guiDefaultButton', {{'^continue', '^save', '^ok$', '^done', '^next', '^accept', '^confirm', '^finish', '^yes$', '^close'}}, ...
  'keys', {{}}, 'defaultKey', 'space', 'kbEvery', 3, 'keyWait', 1.0, 'answerWait', 2.0, 'idleQuantum', 0.001, ...
  'maxStarts', 3000, 'maxIdleSec', 1800, 'maxTrialSec', 120, 'maxSamePrompt', 25, 'floorNoise', 1e-4, 'maxPlayWavs', 200, ...
  'input', [], 'echo_ops', true);
f = fieldnames(d);
for j = 1:numel(f), if ~isfield(plan, f{j}), plan.(f{j}) = d.(f{j}); end, end
LR.plan = plan; LR.outdir = outdir;
LR.vclock = 0; LR.datenum0 = datenum(2026, 1, 5, 9, 0, 0); LR.epoch0 = (LR.datenum0 - datenum(1970, 1, 1)) * 86400;
LR.ptb0 = 1000; LR.ticT = 0; LR.ntrial = 0; LR.ops = {}; LR.notes = {}; LR.echo_ops = plan.echo_ops;
LR.dev = []; LR.phase = ''; LR.nplay = 0; LR.kbPolls = 0; LR.keyQueue = plan.keys; LR.lastKey = '';
LR.ptbWin = 0; LR.ptbTex = 0; LR.ptbDraw = {}; LR.ptbShown = {}; LR.ptbTextSize = 24;
LR.kbKnown = {}; LR.kbStuck = 0; LR.lastProgress = 0; LR.players = {}; LR.recorders = {}; LR.texts = cell(0, 2); LR.speaker = struct('dur', 1, 'level', 1, 'lastPick', -1, 'log', {{}});
LR.ppa = struct('n', 0, 'h', {{}}, 'bufs', {{}});
LR.asked = struct('n', 0, 'keys', {{}}, 'count', []);
LR.counts = struct('userRunFrame', 0, 'getData', 0);
LR.setNames = {}; LR.rngSeed = plan.seed; LR.rngShuffles = 0;
LR.trialIndex = struct('k', {}, 'mode', {}, 't0', {}, 't1', {}, 'word', {}, 'cond', {}, 'phase', {});
LR.pb = struct('counter', 0, 'len', 0, 'max', 480000, 'data', zeros(0, 1));
try, LR.pb.max = double(AudapterReal('getMaxPBLen')); catch, end
% Default answers for the lab's usual console prompts (plan.answers are checked first).
LR.defaultAnswers = {
  'gender', @(p, n) lr_gender_answer(p, plan.gender);
  'participant (number|id)|subject (number|id)|enter participant|snum|participant code', 'lr001';
  'above the height|5'' ?8', @(p, n) ifelse_(strncmpi(plan.gender, 'm', 1), 'y', 'n');
  'load in existing expt|load existing', 'n';
  'overwrite', 'Overwrite';
  'save lpc order and exit', 'Save and exit';
  're-?do [^(]*\((\d+)\)[^(]*move on[^(]*\((\d+)\)', @(p, n) regexpi(p, '\((\d+)\)', 'tokens'){min(n, 2)}{1};
  '[\(\[](redo|repeat)/(move on|continue)[\)\]]', @(p, n) ifelse_(n <= 1, regexpi(p, '[\(\[](\w+)/', 'tokens', 'once'){1}, regexpi(p, '/([\w ]+)[\)\]]', 'tokens', 'once'){1});
  'press enter|press any key|hit enter|enter to (continue|start|go)|press return', '';
  '\(y/n\)|y/n|\[y/n\]|yes/no', @(p, n) ifelse_(isempty(regexpi(p, 'yes/no', 'once')), 'y', 'yes');
  '(\d+) or "?\d+', @(p, n) regexpi(p, '(\d+)"? or', 'tokens', 'once'){1};
  '\((\d+)/\d+', @(p, n) regexpi(p, '\((\d+)/', 'tokens', 'once'){1};
  '[\(\[]([A-Za-z][A-Za-z ]*)/[A-Za-z/ ]+[\)\]]', @(p, n) regexpi(p, '[\(\[]([A-Za-z][A-Za-z ]*)/', 'tokens', 'once'){1};
  'enter \[([A-Za-z0-9]+)\]', @(p, n) regexpi(p, 'enter \[([A-Za-z0-9]+)\]', 'tokens', 'once'){1};
  'please enter ([A-Za-z][A-Za-z ]*)/', @(p, n) regexpi(p, 'enter ([A-Za-z][A-Za-z ]*)/', 'tokens', 'once'){1};
};
% AudapterIO('init') parameter map, read from the AudapterIO.m on the path: {p field, Audapter parameter}
LR.pmap = cell(0, 2);
try
  t = fileread(which('AudapterIO'));
  t = regexprep(t, '^[ \t]*%[^\n]*', '', 'lineanchors');            % commented-out setParams are not sent
  t = regexprep(t, '\.\.\.\s*\n\s*', ' ');          % join continuation lines
  m = regexp(t, 'Audapter\(\s*3\s*,\s*''(\w+)''\s*,\s*p\.(\w+)', 'tokens');
  for j = 1:numel(m), LR.pmap(end+1, :) = {m{j}{2}, lower(m{j}{1})}; end
catch
end
LR.defaultFields = {};
try, LR.defaultFields = fieldnames(getAudapterDefaultParams('female')); catch, end
for sub = {'trials', 'plays', 'ost'}, if ~exist(fullfile(outdir, sub{1}), 'dir'), mkdir(fullfile(outdir, sub{1})); end, end
LR.oplog = fopen(fullfile(outdir, 'ops.tsv'), 'w'); fprintf(LR.oplog, 'vtime\ttrial\trunning\top\targs\n');
LR.timeline = fopen(fullfile(outdir, 'timeline.tsv'), 'w'); fprintf(LR.timeline, 'k\tmode\tt0\tt1\tpumped_s\tword\tcond\tinput\n');
LR.playlog = fopen(fullfile(outdir, 'plays.tsv'), 'w'); fprintf(LR.playlog, 'n\tvtime\ttrial\tsrc\tfs\tdur\tvol\trms_dBFS\tpeak\tnclip\n');
rand('twister', plan.seed); randn('twister', plan.seed);
LR.wall0 = builtin('time');
end
function r = ifelse_(c, a, b)
if c, r = a; else, r = b; end
end
function a = lr_gender_answer(p, g)
if isempty(g), g = 'female'; end
if ~isempty(regexpi(p, 'm/f|\(m\)|\[m', 'once')), a = lower(g(1)); else, a = g; end
end
