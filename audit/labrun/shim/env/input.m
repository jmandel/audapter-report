function r = input(prompt, varargin)
% labrun: console prompts are answered from the plan's rules (lr_ask); every prompt and answer is logged.
global LR
if isempty(LR) || ~isstruct(LR), r = builtin('input', prompt, varargin{:}); return; end
if nargin < 1, prompt = ''; end
isStr = numel(varargin) >= 1 && ischar(varargin{1}) && strcmpi(varargin{1}, 's');
a = lr_ask('input', prompt, {}, '');
lr_advance(LR.plan.answerWait);
if isStr, r = a; return; end
if isempty(a), r = []; return; end
try, r = evalin('caller', a); catch, r = str2double(a); end
end
