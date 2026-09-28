function name = lr_key_event()
% The next simulated key press: from the plan's key queue (LR.plan.keys), else LR.plan.defaultKey. Sets the
% CurrentCharacter of the current figure too (lab code polls get(h,'CurrentCharacter')).
global LR
if ~isempty(LR.keyQueue), name = LR.keyQueue{1}; LR.keyQueue(1) = []; else, name = LR.plan.defaultKey; end
LR.lastKey = name;
lr_log_op(struct('op', 'key', 'key', name));
end
