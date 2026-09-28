function [x, desc] = lr_mic_input(H, h)
% A capture device's microphone signal (PsychPortAudio capture, audiorecorder): the plan's input for this trial, at the device rate the script opened. While an
% Audapter trial runs, it is that trial's microphone signal (resampled), from the capture's start onwards.
global LR
if H.cap.shared && lr_is_running() && LR.dev.k == H.cap.k
  if isempty(LR.dev.input), [LR.dev.input, LR.dev.inputDesc] = lr_pick_input(LR.dev); end
  x = LR.dev.input(max(1, round(H.cap.offset * LR.dev.fsDev) + 1):end);
  if H.fs ~= LR.dev.fsDev, x = resample(x, H.fs, LR.dev.fsDev); end
  desc = sprintf('shared with Audapter trial %d from +%.3f s: %s', H.cap.k, H.cap.offset, LR.dev.inputDesc);
else
  d = struct('k', H.cap.k, 'fsDev', H.fs, 'ctx', H.cap.ctx, 'mode', 'ptbCapture');
  [x, desc] = lr_pick_input(d);
end
lr_log_op(struct('op', 'capture:input', 'handle', h, 'input', desc));
end
