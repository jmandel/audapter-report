function lr_note(msg)
% A notable event (logged in the current trial's op stream and in the run log).
global LR
lr_log_op(struct('op', 'note', 'text', msg));
LR.notes{end+1} = sprintf('[t=%.3f trial %d] %s', LR.vclock, LR.ntrial, msg);
fprintf(stdout, 'labrun: %s\n', msg);
end
