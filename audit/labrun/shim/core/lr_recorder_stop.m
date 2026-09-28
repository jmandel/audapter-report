function lr_recorder_stop(id)
% Stop an audiorecorder: keep what it captured (up to its requested length) and save the capture as a trial.
global LR
R = LR.recorders{id - 2e6}; if ~R.active, return; end
t1 = min(LR.ptb0 + LR.vclock, R.tEnd); n = floor((t1 - R.t0) * R.fs);
if isempty(R.cap.x), [R.cap.x, R.cap.desc] = lr_mic_input(R, id); end
x = zeros(n, 1); m = min(n, numel(R.cap.x)); x(1:m) = R.cap.x(1:m); x(m+1:end) = LR.plan.floorNoise * randn(n - m, 1);
R.data = repmat(x, 1, R.nch(1)); R.cap.read = n;
vc = LR.vclock; LR.vclock = t1 - LR.ptb0; R = lr_mic_close(id, R); LR.vclock = vc;
R.active = false; LR.recorders{id - 2e6} = R;
end
