function lr_follow_feedback()
% The virtual participant follows the lab's on-screen feedback shown since the previous trial: "more slowly" /
% "longer" -> vowels 25 % longer, "faster" / "shorter" -> 20 % shorter, "louder" -> +3 dB, "softer" / "quieter"
% -> -3 dB (bounded). Each adjustment is logged. Plans can disable it with plan.followFeedback = false.
global LR
if isfield(LR.plan, 'followFeedback') && ~LR.plan.followFeedback, return; end
T = LR.texts; if isempty(T), LR.speaker.lastPick = LR.vclock; return; end
new = T([T{:, 1}] > LR.speaker.lastPick, 2);
LR.speaker.lastPick = LR.vclock;
s = lower(strjoin(new', ' | '));
adj = {};
if ~isempty(regexp(s, 'slow|longer|stretch', 'once')), LR.speaker.dur = min(LR.speaker.dur * 1.25, 3); adj{end+1} = 'longer'; end
if ~isempty(regexp(s, 'faster|shorter|quicker', 'once')), LR.speaker.dur = max(LR.speaker.dur / 1.25, 0.3); adj{end+1} = 'shorter'; end
if ~isempty(regexp(s, 'louder', 'once')), LR.speaker.level = min(LR.speaker.level * 1.41, 8); adj{end+1} = 'louder'; end
if ~isempty(regexp(s, 'softer|quieter', 'once')), LR.speaker.level = max(LR.speaker.level / 1.41, 0.125); adj{end+1} = 'softer'; end
if ~isempty(adj)
  lr_log_op(struct('op', 'participant', 'follows', strjoin(adj, ','), 'dur', LR.speaker.dur, 'level', LR.speaker.level));
end
end
