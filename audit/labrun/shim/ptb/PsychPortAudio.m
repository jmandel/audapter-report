function varargout = PsychPortAudio(cmd, varargin)
% labrun (Psychtoolbox stub): virtual PsychPortAudio devices on the labrun virtual clock.
% - Playback (mode 1, or 3 = full duplex): 'FillBuffer'/'CreateBuffer' + 'Start' record what would be played
%   (lr_play_event: level, peak, samples beyond +-1 flagged), with the handle's 'Volume'. The stream is Active
%   until its reps x duration have elapsed in virtual time; 'Stop' with waitForEndOfPlayback advances the clock
%   to the end of playback.
% - Capture (mode 2 or 3): the device records the same virtual microphone as Audapter: the plan's per-trial input
%   (lr_pick_input), at the rate and channel count the script opened, starting at 'Start'. 'GetAudioData'
%   honours the buffer allocated by its first call (amountToAllocateSecs), minimumAmountToReturnSecs (the
%   virtual clock advances until that much is available, as the real call blocks), maximumAmountToReturnSecs,
%   and reports overflow when unread audio exceeded the allocated buffer (oldest samples lost).
% - Each capture Start..Stop is one labrun trial (mode 'ptbCapture'): the captured signal and the plays during it
%   are saved in trials/NNNN.mat like an Audapter trial.
% - Playback while the Audapter virtual device runs is noted (it is not mixed into the microphone).
global LR
varargout = cell(1, max(1, nargout));
now_ = @() LR.ptb0 + LR.vclock;
switch lower(cmd)
  case 'getdevices'
    names = {'Focusrite USB ASIO', 'Speakers (Focusrite USB Audio)', 'Microphone (Focusrite USB Audio)', 'Primary Sound Driver'};
    apis = {'ASIO', 'Windows WASAPI', 'Windows WASAPI', 'MME'};
    d = struct('DeviceIndex', {}, 'HostAudioAPIId', {}, 'HostAudioAPIName', {}, 'DeviceName', {}, 'NrInputChannels', {}, 'NrOutputChannels', {}, 'DefaultSampleRate', {}, 'LowOutputLatency', {}, 'LowInputLatency', {}, 'HighOutputLatency', {}, 'HighInputLatency', {});
    for j = 1:numel(names)
      d(j) = struct('DeviceIndex', j - 1, 'HostAudioAPIId', 3, 'HostAudioAPIName', apis{j}, 'DeviceName', names{j}, 'NrInputChannels', 2, 'NrOutputChannels', 2, 'DefaultSampleRate', 48000, 'LowOutputLatency', 0.005, 'LowInputLatency', 0.005, 'HighOutputLatency', 0.04, 'HighInputLatency', 0.04);
    end
    varargout{1} = d;
  case {'open', 'openslave'}
    LR.ppa.n = LR.ppa.n + 1; h = LR.ppa.n;
    if strcmpi(cmd, 'openslave')
      m = varargin{1}; fs = LR.ppa.h{m}.fs; mode = 1; if numel(varargin) >= 2 && ~isempty(varargin{2}), mode = varargin{2}; end
      nch = LR.ppa.h{m}.nch;
    else
      mode = 1; if numel(varargin) >= 2 && ~isempty(varargin{2}), mode = varargin{2}; end
      fs = 48000; if numel(varargin) >= 4 && ~isempty(varargin{4}), fs = varargin{4}; end
      nch = [2 2]; if numel(varargin) >= 5 && ~isempty(varargin{5}), c = varargin{5}; nch = [c(1) c(end)]; end
    end
    m2 = bitand(mode, 3);   % 1 playback, 2 capture, 3 full duplex (+8 master, +32 slave are ignored)
    LR.ppa.h{h} = struct('fs', fs, 'nch', nch, 'mode', m2, 'buf', [], 'vol', 1, 'active', false, 't0', 0, 'tEnd', 0, ...
      'reps', 1, 'cap', struct('alloc', 0, 'x', [], 'read', 0, 'k', 0, 'lost', 0), 'open', true);
    lr_log_op(struct('op', 'PsychPortAudio:Open', 'handle', h, 'fs', fs, 'mode', mode, 'channels', mat2str(nch)));
    varargout{1} = h;
  case 'fillbuffer'
    h = varargin{1}; b = varargin{2};
    if isscalar(b) && b > 0 && numel(LR.ppa.bufs) >= b, b = LR.ppa.bufs{b}; end
    LR.ppa.h{h}.buf = double(b); varargout{1} = 0;
  case 'createbuffer'
    LR.ppa.bufs{end+1} = double(varargin{2}); varargout{1} = numel(LR.ppa.bufs);
  case 'volume'
    h = varargin{1}; varargout{1} = LR.ppa.h{h}.vol;
    if numel(varargin) >= 2 && ~isempty(varargin{2}), LR.ppa.h{h}.vol = varargin{2}; end
  case 'start'
    h = varargin{1}; reps = 1; if numel(varargin) >= 2 && ~isempty(varargin{2}), reps = varargin{2}; end
    when = 0; if numel(varargin) >= 3 && ~isempty(varargin{3}), when = varargin{3}; end
    if when > now_(), lr_advance(when - now_()); end
    H = LR.ppa.h{h}; H.active = true; H.t0 = now_(); H.reps = reps;
    if bitand(H.mode, 1) && ~isempty(H.buf)
      v = H.vol(1);
      if lr_is_running(), lr_note(sprintf('PsychPortAudio playback (h%d) while Audapter runs; not mixed into the virtual microphone', h)); end
      if reps == 0, r = 1; else, r = reps; end
      lr_play_event(sprintf('PsychPortAudio(h%d)', h), repmat(H.buf', r, 1), H.fs, v);
      H.tEnd = H.t0 + r * size(H.buf, 2) / H.fs; if reps == 0, H.tEnd = inf; end
    end
    if bitand(H.mode, 2)
      c = lr_caller_ctx();
      H.cap = lr_mic_open(h, H.t0, H.cap.alloc, c);
    end
    LR.ppa.h{h} = H; varargout{1} = H.t0;
  case 'reschedulestart'
    varargout{1} = now_();
  case 'stop'
    h = varargin{1}; H = LR.ppa.h{h};
    wait = numel(varargin) >= 2 && ~isempty(varargin{2}) && varargin{2} > 0;
    if wait && isfinite(H.tEnd) && H.tEnd > now_(), lr_advance(H.tEnd - now_()); end
    if bitand(H.mode, 2) && H.active, H = lr_mic_close(h, H); end
    t = now_(); H.active = false;
    varargout{1} = H.t0; varargout{2} = t - H.t0; varargout{3} = 0; varargout{4} = t;
    LR.ppa.h{h} = H;
  case 'close'
    if numel(varargin) >= 1 && ~isempty(varargin{1}), hs = varargin{1}; else, hs = 1:numel(LR.ppa.h); end
    for h = hs(:)', if numel(LR.ppa.h) >= h && isstruct(LR.ppa.h{h}) && LR.ppa.h{h}.active && bitand(LR.ppa.h{h}.mode, 2), LR.ppa.h{h} = lr_mic_close(h, LR.ppa.h{h}); end, end
  case 'getaudiodata'
    h = varargin{1}; H = LR.ppa.h{h}; fs = H.fs;
    alloc = []; if numel(varargin) >= 2 && ~isempty(varargin{2}), alloc = varargin{2}; end
    minS = 0; if numel(varargin) >= 3 && ~isempty(varargin{3}), minS = varargin{3}; end
    maxS = inf; if numel(varargin) >= 4 && ~isempty(varargin{4}), maxS = varargin{4}; end
    if ~isempty(alloc) && ~H.active, H.cap.alloc = alloc; end
    data = zeros(H.nch(1), 0); pos = 0; over = 0; cst = H.t0;
    if ~H.active && isfield(H.cap, 'stopAvail') && H.cap.stopAvail > H.cap.read && ~isempty(H.cap.x)   % drain after Stop
      n = H.cap.stopAvail - H.cap.read; i0 = H.cap.read + (1:n); seg = zeros(n, 1); ok = i0 <= numel(H.cap.x); seg(ok) = H.cap.x(i0(ok));
      data = repmat(seg', H.nch(1), 1); pos = H.cap.read / fs; H.cap.read = H.cap.stopAvail;
    end
    if H.active
      if isempty(H.cap.x), [H.cap.x, H.cap.desc] = lr_mic_input(H, h); end
      if minS > 0
        need = H.cap.read + ceil(minS * fs); availNow = floor((now_() - H.t0) * fs);
        if availNow < need, lr_advance((need - availNow) / fs); end
      end
      avail = floor((now_() - H.t0) * fs);
      if H.cap.alloc > 0 && avail - H.cap.read > H.cap.alloc * fs    % ring buffer overran: oldest unread samples lost
        lost = avail - H.cap.read - floor(H.cap.alloc * fs); H.cap.read = H.cap.read + lost; H.cap.lost = H.cap.lost + lost; over = 1;
        lr_note(sprintf('PsychPortAudio capture h%d overflow: %d samples lost', h, lost));
      end
      n = avail - H.cap.read; if isfinite(maxS), n = min(n, floor(maxS * fs)); end
      x = H.cap.x; i0 = H.cap.read + (1:n);
      seg = zeros(n, 1); ok = i0 <= numel(x); seg(ok) = x(i0(ok)); seg(~ok) = LR.plan.floorNoise * randn(sum(~ok), 1);
      data = repmat(seg', H.nch(1), 1); pos = H.cap.read / fs; H.cap.read = H.cap.read + n;
    end
    LR.ppa.h{h} = H;
    varargout{1} = data; varargout{2} = pos; varargout{3} = over; varargout{4} = cst;
  case 'getstatus'
    h = varargin{1}; H = LR.ppa.h{h}; t = now_();
    act = H.active && (bitand(H.mode, 2) || t < H.tEnd);
    rec = 0; if H.active && bitand(H.mode, 2), rec = (t - H.t0); end
    varargout{1} = struct('Active', double(act), 'State', double(act) * 2, 'RequestedStartTime', H.t0, 'StartTime', H.t0, ...
      'CaptureStartTime', H.t0, 'RequestedStopTime', inf, 'EstimatedStopTime', H.tEnd, 'CurrentStreamTime', t, ...
      'ElapsedOutSamples', round(max(0, min(t, H.tEnd) - H.t0) * H.fs), 'PositionSecs', max(0, t - H.t0), 'RecordedSecs', rec, ...
      'ReadSecs', H.cap.read / H.fs, 'SchedulePosition', 0, 'XRuns', 0, 'TotalCalls', 0, 'TimeFailed', 0, 'BufferSize', 0, ...
      'CPULoad', 0, 'PredictedLatency', 0.005, 'LatencyBias', 0, 'SampleRate', H.fs, 'OutDeviceIndex', 0, 'InDeviceIndex', 0);
  case 'version', varargout{1} = struct('version', '3.0.19 labrun');
  case 'getopenhandlecount', varargout{1} = sum(cellfun(@(x) isstruct(x) && x.open, LR.ppa.h));
  otherwise
    for j = 1:numel(varargout), varargout{j} = 0; end
end
end
