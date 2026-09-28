function a = lr_ask(kind, prompt, choices, dflt)
% Answer an interactive question (console input(), questdlg, inputdlg, ...) from the plan's rules.
% Rules: LR.plan.answers = {regexp, answer; ...} (checked first), then LR.defaultAnswers. An answer may be a
% function handle @(prompt, n) (n = how many times this prompt was asked). Unmatched: dflt.
global LR
if iscell(prompt), prompt = strjoin(prompt, ' | '); end
prompt = char(prompt); key = regexprep(prompt, '\s+', ' ');
LR.asked.n = LR.asked.n + 1;
LR.kbStuck = 0; LR.lastProgress = LR.vclock;
m = find(strcmp(LR.asked.keys, key), 1);
if isempty(m), LR.asked.keys{end+1} = key; LR.asked.count(end+1) = 0; m = numel(LR.asked.keys); end
LR.asked.count(m) = LR.asked.count(m) + 1; n = LR.asked.count(m);
if n > LR.plan.maxSamePrompt
  error('labrun:prompt', 'labrun: prompt asked %d times, answers are not accepted: "%s"', n, key);
end
rules = [LR.plan.answers; LR.defaultAnswers];
a = dflt; how = 'default';
for j = 1:size(rules, 1)
  if ~isempty(regexpi(key, rules{j, 1}, 'once'))
    a = rules{j, 2}; how = rules{j, 1};
    if is_function_handle(a), a = a(key, n); end
    break
  end
end
if isnumeric(a), a = num2str(a); end
if ~isempty(choices) && ~any(strcmp(a, choices)) && strcmp(how, 'default') && ~isempty(dflt), a = dflt; end
lr_log_op(struct('op', ['ask:' kind], 'prompt', key, 'answer', a, 'rule', how));
fprintf(stdout, 'labrun %s: "%s" -> "%s"\n', kind, key, a);
end
