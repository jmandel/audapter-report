function varargout = Audapter(varargin)
% labrun Audapter device shim. Sits ahead of the real MEX (renamed AudapterReal.mex) on the path.
% - Every call is forwarded to the real MEX, except the device actions, which the Octave build cannot do
%   (its audio layer has no devices):
%     'start'      -> the real MEX's own reset (Audapter's start calls audapter.reset() before opening the device),
%                     then a virtual device runs: time advanced by pause/WaitSecs/GetSecs/tic-toc (lr_advance)
%                     pumps round(t * device rate) samples of the planned input through the real 'runFrame'
%                     in frames of frameLen*downFact (a fresh copy per call; finding H3).
%     'stop'       -> the trial is closed (a partially filled frame is dropped, as a device stop would).
%     'playWave'   -> reset + a virtual WAV_PLAYBACK device: the played samples are data_pb read by the same rule
%                     as Audapter.cpp handleBufferWavePB (from pbCounter, wrap at maxPBSize, no gain). data_pb and
%                     pbCounter are mirrored here (getParam cannot read them): data_pb = the last setParam datapb
%                     vector, zero after it; pbCounter 0 on setParam datapb, +frameLen*downFact per frame in fb 2..5.
%     'playTone'   -> reset + a virtual sine generator (wgAmp*sin(2*pi*wgFreq*t), handleBufferSineGen).
%     'playToneSeq'-> reset + recorded as an event only (tone-sequence generator not simulated).
%     'deviceName' -> forwarded (it only stores the name); 'info' -> forwarded plus a note.
% - Every call is logged with its arguments (arrays summarised), OST/PCF file text, and trial boundaries.
global LR
a = varargin{1};
if isnumeric(a)
  codes = {0,'info'; 1,'start'; 2,'stop'; 3,'setParam'; 15,'getParam'; 4,'getData'; 5,'runFrame'; 6,'reset'; ...
           7,'outFrame'; 8,'ost'; 9,'pcf'; 11,'playTone'; 12,'playWave'; 13,'playToneSeq'; 14,'writeToneSeq'; ...
           51,'getMaxPBLen'; 100,'deviceName'; 999,'version'};
  i = find([codes{:,1}] == a, 1); if ~isempty(i), a = codes{i, 2}; else, a = sprintf('code%d', a); end
end
if isempty(LR) || ~isstruct(LR)   % used outside labrun: plain pass-through
  [varargout{1:nargout}] = AudapterReal(varargin{:}); return
end
switch a
  case 'start'
    lr_log_op(struct('op', 'start'));
    if lr_is_running(), lr_note('Audapter start while already running (MEX prints "Already started")'); return; end
    AudapterReal('reset');
    lr_device_start('proc', lr_caller_ctx());
  case {'playWave', 'playTone', 'playToneSeq'}
    lr_log_op(struct('op', a));
    if lr_is_running(), lr_note(['Audapter ' a ' while already running']); return; end
    AudapterReal('reset');
    lr_device_start(a, lr_caller_ctx());
  case 'stop'
    lr_log_op(struct('op', 'stop'));
    if lr_is_running(), lr_device_stop(); else, lr_note('Audapter stop while not started'); end
  case 'setParam'
    nm = varargin{2}; v = varargin{3};
    lr_log_op(struct('op', 'setParam', 'name', nm, 'value', lr_summ(v)));
    if lr_is_running(), lr_note(sprintf('setParam %s while audio running (LIVE-2/3 territory)', nm)); end
    [varargout{1:nargout}] = AudapterReal(varargin{:});
    if strcmpi(nm, 'datapb'), LR.pb.counter = 0; LR.pb.len = numel(v); LR.pb.data = double(v(:)); end   % mirror: data_pb = v, zeros after (Audapter.cpp setParam)
    if ~any(strcmp(LR.setNames, lower(nm))), LR.setNames{end+1} = lower(nm); end
  case {'ost', 'pcf'}
    fn = ''; if numel(varargin) >= 2, fn = varargin{2}; end
    txt = ''; if ischar(fn) && ~isempty(fn) && exist(fn, 'file'), txt = fileread(fn); end
    lr_log_op(struct('op', a, 'file', fn, 'text', txt));
    if lr_is_running(), lr_note(sprintf('%s load while audio running (LIVE-1)', a)); end
    [varargout{1:nargout}] = AudapterReal(varargin{:});
  case 'reset'
    lr_log_op(struct('op', 'reset'));
    if lr_is_running(), lr_note('reset while audio running (LIVE-3)'); end
    [varargout{1:nargout}] = AudapterReal(varargin{:});
  case 'runFrame'
    fr = double(varargin{2}) + 0;       % the caller's own buffer is not handed to the MEX (H3)
    AudapterReal('runFrame', fr);
    LR.counts.userRunFrame = LR.counts.userRunFrame + 1;
  case 'getData'
    [varargout{1:nargout}] = AudapterReal(varargin{:});
    lr_log_op(struct('op', 'getData'));
    if nargout >= 2, lr_capture_getdata(varargout{1}, varargout{2}); end
  case 'getParam'
    [varargout{1:nargout}] = AudapterReal(varargin{:});
  case 'info'
    lr_log_op(struct('op', 'info'));
    lr_note('Audapter info: virtual labrun device');
  otherwise
    args = cellfun(@lr_summ, varargin(2:end), 'UniformOutput', false);
    lr_log_op(struct('op', a, 'args', {args}));
    [varargout{1:nargout}] = AudapterReal(varargin{:});
end
end
