function record(id, secs)
% labrun: start an audiorecorder on the virtual microphone (optionally for secs of virtual time).
global LR
R = LR.recorders{id - 2e6}; R.t0 = LR.ptb0 + LR.vclock; R.active = true;
R.cap = lr_mic_open(id, R.t0, 0, lr_caller_ctx());
if nargin > 1, R.tEnd = R.t0 + secs; else, R.tEnd = inf; end
LR.recorders{id - 2e6} = R;
end
