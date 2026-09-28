function lr_saw_text(s)
% Record text shown to the participant (figure text, Psychtoolbox text) with its virtual time; the virtual
% participant (lr_pick_input) reacts to feedback such as "speak more slowly" / "louder".
global LR
if isempty(LR) || ~isstruct(LR), return; end
if iscell(s), s = strjoin(s, ' '); end
if size(s, 1) > 1, s = strjoin(cellstr(s)', ' '); end
LR.texts(end+1, :) = {LR.vclock, char(s)};
LR.kbStuck = 0; LR.lastProgress = LR.vclock;
end
