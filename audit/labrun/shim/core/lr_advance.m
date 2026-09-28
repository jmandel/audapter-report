function lr_advance(dt)
% Advance the virtual clock by dt seconds. While the virtual device runs, pump round(dt * device rate) samples
% (carried over between calls, so no time is lost) through the real MEX, one frame of frameLen*downFact at a time.
global LR
if isempty(dt) || ~isfinite(dt) || dt <= 0, return; end
LR.vclock = LR.vclock + dt;
if LR.vclock - LR.lastProgress > LR.plan.maxIdleSec
  error('labrun:idle', 'labrun: %g s of virtual time without a trial, a prompt or new text (plan.maxIdleSec): the script is waiting for something the simulation does not provide', LR.plan.maxIdleSec);
end
if ~lr_is_running(), return; end
d = LR.dev;
d.acc = d.acc + dt * d.fsDev;
n = floor(d.acc / d.frame + 1e-9);
d.acc = d.acc - n * d.frame;
if (LR.vclock - d.t0) > LR.plan.maxTrialSec
  LR.dev = d;
  error('labrun:longTrial', 'labrun: device running for more than %g s of virtual time (plan.maxTrialSec)', LR.plan.maxTrialSec);
end
if n > 0 && isempty(d.input) && strcmp(d.mode, 'proc')
  [d.input, d.inputDesc] = lr_pick_input(d);    % chosen lazily: stimulus text is usually drawn just after start
end
for j = 1:n
  switch d.mode
    case 'proc'
      i0 = d.pos + 1; i1 = d.pos + d.frame;
      if i1 <= numel(d.input)
        fr = d.input(i0:i1);
      else
        fr = zeros(d.frame, 1); m = max(0, numel(d.input) - d.pos);
        if m > 0, fr(1:m) = d.input(i0:end); end
        fr = fr + LR.plan.floorNoise * randn(d.frame, 1);
      end
      fr = double(fr(:)) + 0;                       % a fresh buffer for every call (H3)
      AudapterReal('runFrame', fr);
      if d.fb >= 2 && d.fb <= 5, LR.pb.counter = mod(LR.pb.counter + d.frame, LR.pb.max); end
    case 'playWave'
      idx = mod(LR.pb.counter + (0:d.frame-1), d.maxPB) + 1;
      d.play = [d.play; d.datapb(idx)];
      LR.pb.counter = mod(LR.pb.counter + d.frame, d.maxPB);
    case 'playTone'
      tt = d.wgTime + (0:d.frame-1)' / d.fsDev; d.wgTime = tt(end) + 1 / d.fsDev;
      d.play = [d.play; d.wgAmp * sin(2 * pi * d.wgFreq * tt)];
    otherwise
  end
  d.pos = d.pos + d.frame; d.nframes = d.nframes + 1;
end
LR.dev = d;
end
