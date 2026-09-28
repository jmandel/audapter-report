function cap = lr_mic_open(h, t0, alloc, c)
% Start a capture session on the virtual microphone at PTB time t0. While an Audapter trial runs, the capture shares
% that trial's microphone signal (same trial number, offset from the trial start); otherwise it is a trial of its own.
global LR
if lr_is_running()
  cap = struct('alloc', alloc, 'x', [], 'read', 0, 'k', LR.dev.k, 'lost', 0, 'ctx', LR.dev.ctx, 'desc', '', 'shared', true, 'offset', t0 - LR.ptb0 - LR.dev.t0);
  lr_log_op(struct('op', 'capture:start', 'handle', h, 'trial', LR.dev.k, 'shared_with_audapter', 1));
else
  LR.ntrial = LR.ntrial + 1;
  cap = struct('alloc', alloc, 'x', [], 'read', 0, 'k', LR.ntrial, 'lost', 0, 'ctx', lr_ctx_summary(c), 'desc', '', 'shared', false, 'offset', 0);
  lr_log_op(struct('op', 'capture:start', 'handle', h, 'trial', LR.ntrial));
end
end
