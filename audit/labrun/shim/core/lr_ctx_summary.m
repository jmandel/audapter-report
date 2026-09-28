function s = lr_ctx_summary(c)
% Small summary of the lab script's context at trial start: trial index, word, condition, expt name.
s = struct('itrial', NaN, 'word', '', 'cond', '', 'expt', '', 'gender', '', 'shift', '', 'stimText', '');
it = [];
for nm = {'trial_index', 'itrial', 'iTrial', 'trialInd', 'trialNum', 'thisTrial', 'trial'}
  if isfield(c, nm{1}) && isnumeric(c.(nm{1})) && isscalar(c.(nm{1})), it = c.(nm{1}); break; end
end
if ~isempty(it), s.itrial = it; end
if isfield(c, 'expt') && isstruct(c.expt)
  e = c.expt;
  if isfield(e, 'name') && ischar(e.name), s.expt = e.name; end
  if isfield(e, 'gender') && ischar(e.gender), s.gender = e.gender; end
  if ~isempty(it)
    s.word = lr_pick(e, {'listWords', 'listStimulusText', 'listStim', 'listSentences'}, it);
    s.cond = lr_pick(e, {'listConds', 'listCond', 'listPhases'}, it);
    for f = {'shiftMags', 'shiftMag', 'listShiftMags', 'pertMags', 'shiftNames'}
      if isfield(e, f{1}) && numel(e.(f{1})) >= it && numel(e.(f{1})) > 1
        v = e.(f{1})(it); if iscell(v), v = v{1}; end
        if isnumeric(v), v = num2str(v); end
        if ischar(v), s.shift = [f{1} '=' v]; break; end
      end
    end
  end
end
end
function w = lr_pick(e, names, it)
w = '';
for f = names
  if isfield(e, f{1}) && iscell(e.(f{1})) && numel(e.(f{1})) >= it
    w = e.(f{1}){it}; if ~ischar(w), w = ''; end
    if ~isempty(w), return; end
  end
end
end
