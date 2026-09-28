function id = audiorecorder(fs, nbits, nch, varargin)
% labrun: an audiorecorder on the virtual microphone (shadows Octave's, which needs a sound device). Returns a
% numeric recorder id (>= 2e6); record / recordblocking / stop / getaudiodata / isrecording work on it. What it
% records is the plan's per-trial input (lr_mic_input), like PsychPortAudio capture.
global LR
if nargin < 1 || isempty(fs), fs = 8000; end
if nargin < 3 || isempty(nch), nch = 1; end
LR.recorders{end+1} = struct('fs', fs, 'nch', [nch nch], 'kind', 'audiorecorder', 'active', false, 't0', 0, 'tEnd', inf, ...
  'cap', struct('alloc', 0, 'x', [], 'read', 0, 'k', 0, 'lost', 0), 'data', zeros(0, nch));
id = 2e6 + numel(LR.recorders);
lr_log_op(struct('op', 'audiorecorder', 'id', id, 'fs', fs, 'channels', nch));
end
