function s = rng(varargin)
% labrun: reproducible randomness. rng('shuffle') (time-based) becomes a seed derived from plan.seed and a
% counter; explicit seeds are honoured. Generator state is set for rand, randn, randi (rand), randperm (rand).
global LR
if nargout, s = struct('Type', 'twister', 'Seed', LR.rngSeed, 'State', rand('twister')); end
if nargin == 0, return; end
a = varargin{1};
if isstruct(a), rand('twister', a.State); LR.rngSeed = a.Seed; return; end
if ischar(a)
  switch lower(a)
    case 'shuffle', LR.rngShuffles = LR.rngShuffles + 1; seed = LR.plan.seed * 1000 + LR.rngShuffles;
      lr_log_op(struct('op', 'rng', 'arg', 'shuffle', 'seed', seed));
    case 'default', seed = 0;
    otherwise, return
  end
else
  seed = double(a);
end
LR.rngSeed = seed; rand('twister', seed); randn('twister', seed);
end
