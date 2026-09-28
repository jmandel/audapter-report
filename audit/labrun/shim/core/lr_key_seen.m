function lr_key_seen(name)
% Keys the lab code asks KbName about are the keys it waits for; the simulated keyboard presses them in turn.
global LR
if isempty(LR) || ~isstruct(LR), return; end
if ~any(strcmpi(LR.kbKnown, name)), LR.kbKnown{end+1} = name; end
end
