function varargout = Screen(cmd, varargin)
% labrun (Psychtoolbox stub): a virtual 1920x1080 display at 60 Hz. Text drawing is recorded (the text shown at
% the last Flip is what lr_pick_input sees as the stimulus). 'Flip' advances the virtual clock by one refresh
% (or to its 'when' time), pumping audio if the virtual device runs.
global LR
varargout = cell(1, max(1, nargout));
rect = [0 0 1920 1080];
switch lower(cmd)
  case 'screens', varargout{1} = [0 1 2];
  case {'openwindow', 'openoffscreenwindow'}
    LR.ptbWin = LR.ptbWin + 1; varargout{1} = 10 + LR.ptbWin; varargout{2} = rect;
    lr_log_op(struct('op', ['Screen:' cmd]));
  case 'rect', varargout{1} = rect;
  case 'windowsize', varargout{1} = 1920; varargout{2} = 1080;
  case 'framerate', varargout{1} = 60;
  case 'getflipinterval', varargout{1} = 1/60; varargout{2} = 100; varargout{3} = 0;
  case 'resolution', varargout{1} = struct('width', 1920, 'height', 1080, 'pixelSize', 32, 'hz', 60);
  case 'nominalframerate', varargout{1} = 60;
  case 'computer', varargout{1} = struct('windows', 1, 'osx', 0, 'linux', 0, 'machineName', 'labrun');
  case {'textsize'}, varargout{1} = LR.ptbTextSize; if numel(varargin) >= 2, LR.ptbTextSize = varargin{2}; end
  case {'textfont'}, varargout{1} = 'Arial'; varargout{2} = 0;
  case {'textstyle'}, varargout{1} = 0;
  case {'textcolor', 'textbackgroundcolor'}, varargout{1} = [255 255 255];
  case 'textbounds'
    s = ''; if numel(varargin) >= 2, s = char(varargin{2}); end
    w = 0.55 * LR.ptbTextSize * numel(s); varargout{1} = [0 0 w LR.ptbTextSize]; varargout{2} = varargout{1};
  case 'drawtext'
    s = ''; if numel(varargin) >= 2, s = char(varargin{2}); end
    LR.ptbDraw{end+1} = s; lr_saw_text(s);
    x = 0; if numel(varargin) >= 3, x = varargin{3}; end
    y = 0; if numel(varargin) >= 4, y = varargin{4}; end
    varargout{1} = x + 0.55 * LR.ptbTextSize * numel(s); varargout{2} = y; varargout{3} = [x y varargout{1} y + LR.ptbTextSize];
  case 'flip'
    when = 0; if numel(varargin) >= 2 && ~isempty(varargin{2}), when = varargin{2}; end
    nowT = LR.ptb0 + LR.vclock;
    if when > nowT, lr_advance(when - nowT); else, lr_advance(1/60); end
    LR.ptbShown = LR.ptbDraw; dontclear = numel(varargin) >= 3 && ~isempty(varargin{3}) && varargin{3} > 0;
    if ~dontclear, LR.ptbDraw = {}; end
    if ~isempty(LR.ptbShown), lr_log_op(struct('op', 'Screen:Flip', 'text', strjoin(LR.ptbShown, ' | '))); end
    t = LR.ptb0 + LR.vclock; varargout{1} = t; varargout{2} = t; varargout{3} = t; varargout{4} = 0; varargout{5} = 0;
  case {'maketexture', 'openmovie'}, LR.ptbTex = LR.ptbTex + 1; varargout{1} = 100 + LR.ptbTex;
  case 'preference', varargout{1} = 0;
  case 'getimage', varargout{1} = zeros(10, 10, 3, 'uint8');
  case 'version', varargout{1} = struct('version', '3.0.19 labrun');
  case {'close', 'closeall'}, lr_log_op(struct('op', ['Screen:' cmd]));
  case 'blendfunction', varargout{1} = 'GL_ONE'; varargout{2} = 'GL_ZERO'; varargout{3} = [1 1 1 1];
  case 'colorrange', varargout{1} = 255;
  case 'windowkind', varargout{1} = 1;
  case 'globalrect', varargout{1} = rect;
  case 'getwindowinfo', varargout{1} = struct('Beamposition', 0);
  otherwise
    for j = 1:numel(varargout), varargout{j} = 0; end
end
end
