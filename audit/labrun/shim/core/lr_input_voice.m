function [x, desc] = lr_input_voice(req, style)
% Voice-bank participant (plan.voice / LR_VOICE = talker id): a recorded or AI-generated (TTS) token of the requested
% text by that talker, from audit/labrun/voices/bank.tsv (plus the private bank when present). Repetitions of a text
% cycle through the talker's accepted takes, so consecutive trials differ. On-screen "slower"/"faster" feedback picks
% a longer/shorter take (no time-stretch is applied); "louder"/"softer" scales the level. The token is scaled so its
% vowel nucleus (20 ms frames within 10 dB of the loudest) has RMS 0.05 x the feedback level, with 0.30 s (+-15 %)
% of silence before it and 0.25 s after, plus the plan's microphone noise floor (floorNoise, default 1e-4 = -80 dBFS)
% throughout. Rest trials ("xx", "+", no text) are silent (noise floor only).
global LR
if ~isfield(req, 'durScale'), req.durScale = 1; req.levelScale = 1; end
if nargin < 2 || isempty(style), style = ''; end
B = lr_voice_bank();
key = lower(regexprep(strtrim(req.word), '\s+', ' '));
if isempty(key) || any(strcmp(key, {'xx', '+', 'x', '...'}))
  x = LR.plan.floorNoise * randn(round(req.fs * 1.0), 1); desc = sprintf('voice %s rest (text "%s"): silence', LR.plan.voice, req.word); return;
end
sel = strcmp(B.key, key) & strcmp(B.talker, LR.plan.voice) & strcmp(B.status, 'ok');
if strcmp(style, 'sustained'), sel = sel & strcmp(B.style, 'sustained'); else, sel = sel & ~strcmp(B.style, 'sustained'); end
idx = find(sel);
if isempty(idx)
  lr_note(sprintf('voice bank: no accepted token of "%s" (%s) for talker %s; synthetic fallback', req.word, style, LR.plan.voice));
  [x, d0] = lr_input_synth(req, struct('kind', 'synth')); desc = ['FALLBACK ' d0]; return;
end
[~, o] = sort(B.take(idx)); idx = idx(o);
if ~isfield(LR, 'voiceRep') || isempty(LR.voiceRep), LR.voiceRep = struct('key', {{}}, 'n', []); end
j = find(strcmp(LR.voiceRep.key, key), 1);
if isempty(j), LR.voiceRep.key{end+1} = key; LR.voiceRep.n(end+1) = 0; j = numel(LR.voiceRep.n); end
rep = LR.voiceRep.n(j); LR.voiceRep.n(j) = rep + 1;
pool = idx; note = '';
if numel(idx) > 1 && abs(req.durScale - 1) > 0.05          % feedback on speaking rate: pick from the longer/shorter takes
  [~, o] = sort(B.dur(idx)); h = ceil(numel(idx) / 2);
  if req.durScale > 1, pool = idx(o(end-h+1:end)); note = ' rate=longer-take'; else, pool = idx(o(1:h)); note = ' rate=shorter-take'; end
end
t = pool(mod(rep, numel(pool)) + 1);
[y, fs0] = audioread(B.path{t}); y = mean(y, 2);
if fs0 ~= req.fs, y = resample(y, req.fs, fs0); end
y = y / B.nucleus_rms(t) * 0.05 * req.levelScale;
rs = rand('twister'); rand('twister', 1000 + req.k); on = 0.30 * (1 + 0.15 * (2 * rand - 1)); rand('twister', rs);
x = [zeros(round(on * req.fs), 1); y; zeros(round(0.25 * req.fs), 1)];
rn = randn('state'); randn('state', 3000 + req.k); x = x + LR.plan.floorNoise * randn(size(x)); randn('state', rn);   % mic floor
% onset = word onset in the microphone signal (s), dur = word duration, vowel = vowel nucleus (voiced, within 15 dB of peak)
desc = sprintf('voice %s "%s" tok=%s take=%d src=%s f0=%.0f onset=%.3f dur=%.3f vowel=%.3f-%.3f level=%.3f%s', LR.plan.voice, req.word, ...
  B.tok{t}, B.take(t), B.source{t}, B.f0(t), on + B.lead(t), B.dur(t), on + B.v_on(t), on + B.v_off(t), 0.05 * req.levelScale, note);
end
