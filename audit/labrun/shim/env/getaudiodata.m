function y = getaudiodata(id, dtype)
% labrun: samples an audiorecorder captured from the virtual microphone (so far, if still recording).
global LR
R = LR.recorders{id - 2e6};
if R.active
  if isfinite(R.tEnd) && LR.ptb0 + LR.vclock >= R.tEnd, lr_recorder_stop(id); R = LR.recorders{id - 2e6}; y = R.data;
  else
    n = floor((LR.ptb0 + LR.vclock - R.t0) * R.fs);
    if isempty(R.cap.x), [R.cap.x, R.cap.desc] = lr_mic_input(R, id); LR.recorders{id - 2e6} = R; end
    x = zeros(n, 1); m = min(n, numel(R.cap.x)); x(1:m) = R.cap.x(1:m); y = repmat(x, 1, R.nch(1));
  end
else
  y = R.data;
end
if nargin > 1 && strcmpi(dtype, 'int16'), y = int16(round(y * 32767)); end
end
