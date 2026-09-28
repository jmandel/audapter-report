function [nx, ny, bounds, wrapped] = DrawFormattedText(win, tstring, sx, sy, varargin)
% labrun (Psychtoolbox stub): records the text (see Screen 'DrawText').
global LR
if nargin < 2, tstring = ''; end
tstring = char(tstring); LR.ptbDraw{end+1} = tstring; lr_saw_text(tstring);
nx = 0; ny = 0; bounds = [0 0 0.55 * LR.ptbTextSize * numel(tstring) LR.ptbTextSize]; wrapped = tstring;
end
