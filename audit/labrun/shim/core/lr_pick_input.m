function [x, desc] = lr_pick_input(d)
% Choose the microphone signal for a trial. req carries what the lab code shows or intends: the word from
% expt.list* at the script's trial index, the on-screen text (figure text objects / Psychtoolbox text), the
% condition, the participant gender. plan.input(req) may return [x, desc] (x at the device rate) or a
% struct(kind='synth'|'wav'|'silence', ...). Default: a synthetic utterance of the word (lr_input_synth); with plan.voice
% (LR_VOICE) set, a voice-bank token of the text by that talker (lr_input_voice; plan.input is then not used).
global LR
req = struct('k', d.k, 'fs', d.fsDev, 'word', d.ctx.word, 'cond', d.ctx.cond, 'itrial', d.ctx.itrial, ...
  'gender', LR.plan.gender, 'screen', {lr_screen_text()}, 'exptName', d.ctx.expt);
if ~isempty(d.ctx.gender) && isempty(LR.plan.gender), req.gender = d.ctx.gender; end
if isempty(req.gender), req.gender = 'female'; end
if isempty(req.word)
  s = req.screen; s = s(~cellfun(@isempty, regexp(s, '[A-Za-z]')));
  s = s(cellfun(@isempty, regexpi(s, 'trial|cond|press|break|thank|louder|softer|wait|ready|paus|%')));
  if ~isempty(s), req.word = s{end}; end
end
lr_follow_feedback();
req.durScale = LR.speaker.dur; req.levelScale = LR.speaker.level;
if ~isempty(LR.plan.voice), [x, desc] = lr_input_voice(req, LR.plan.voiceStyle); return; end   % voice-bank participant
if isa(LR.plan.input, 'function_handle'), spec = LR.plan.input(req); else, spec = struct('kind', 'synth'); end
if isnumeric(spec), x = spec(:); desc = 'plan'; return; end
switch spec.kind
  case 'synth', [x, desc] = lr_input_synth(req, spec);
  case 'wav', [x, desc] = lr_input_wav(req, spec);
  case 'silence', x = zeros(round(req.fs * 0.01), 1); desc = 'silence';
  otherwise, error('labrun: unknown input kind %s', spec.kind);
end
end
