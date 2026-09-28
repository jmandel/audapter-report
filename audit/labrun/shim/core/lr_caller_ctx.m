function c = lr_caller_ctx()
% What the lab script had in scope when it started the trial (read-only): its parameter struct (p / params),
% expt, and the trial-index variable. Used for the intended-vs-actual parameter diff and to pick the input.
% Call it from a shim function body (Audapter.m, PsychPortAudio.m): this function's caller is the shim, and the lab
% script is one level further up (nested evalin).
c = struct();
names = {'p', 'params', 'expt', 'itrial', 'trial_index', 'iTrial', 'trialInd', 'trialNum', 'thisTrial', 'trial', 'i', 'ii', 'k', 'n'};
try, vars = evalin('caller', 'evalin(''caller'', ''who'')'); catch, vars = {}; end
names = intersect(names, vars);
for j = 1:numel(names)
  try, c.(names{j}) = evalin('caller', sprintf('evalin(''caller'', ''%s'')', names{j})); catch, end
end
end
