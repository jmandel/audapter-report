function name = lr_key_event()
% The next simulated key press: from the plan's key queue (LR.plan.keys), else LR.plan.defaultKey. Sets the
% CurrentCharacter of the current figure too (lab code polls get(h,'CurrentCharacter')).
global LR
% Without a queued key: the default key, except that consecutive presses with nothing else happening in between
% (a script waiting for a particular key) cycle through the keys the script named via KbName (quit keys last).
if ~isempty(LR.keyQueue), name = LR.keyQueue{1}; LR.keyQueue(1) = [];
else
  if LR.kbStuck > 0 && ~isempty(LR.kbKnown)
    k = LR.kbKnown; q = ~cellfun(@isempty, regexpi(k, '^(escape|esc|q|quit)$')); k = [k(~q), k(q)];
    name = k{mod(LR.kbStuck - 1, numel(k)) + 1};
  else
    name = LR.plan.defaultKey;
  end
  LR.kbStuck = LR.kbStuck + 1;
end
LR.lastKey = name;
lr_log_op(struct('op', 'key', 'key', name));
end
