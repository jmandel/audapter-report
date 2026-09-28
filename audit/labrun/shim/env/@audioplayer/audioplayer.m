function h = audioplayer(y, fs, varargin)
% labrun: record-only audio player. Shadows Octave's @audioplayer constructor (which needs a sound device). The
% player is an invisible graphics object (an hggroup in a hidden figure) carrying the audioplayer properties, so
% arrays of players and get/set work natively; play/playblocking record the samples (lr_play_event), and
% playblocking advances the virtual clock.
global LR
if nargin < 2, fs = 8192; end
if ~isnumeric(y), y = zeros(0, 1); end
if ~isfield(LR, 'audioFig') || isempty(LR.audioFig) || ~ishghandle(LR.audioFig)
  LR.audioFig = figure('Visible', 'off', 'HandleVisibility', 'off', 'Tag', 'labrun-audioplayers', 'IntegerHandle', 'off');
  LR.audioAx = axes('Parent', LR.audioFig, 'HandleVisibility', 'off');
end
h = hggroup('Parent', LR.audioAx, 'HandleVisibility', 'off');
props = {'SampleRate', fs; 'TotalSamples', size(y, 1); 'NumberOfChannels', size(y, 2); 'BitsPerSample', 16; 'Running', 'off'; ...
  'CurrentSample', 1; 'StartFcn', []; 'StopFcn', []; 'TimerFcn', []; 'TimerPeriod', 0.05; 'DeviceID', -1};
for j = 1:size(props, 1), addproperty(props{j, 1}, h, 'any', props{j, 2}); end
LR.players{end+1} = struct('h', h, 'y', double(y), 'SampleRate', fs);
end
