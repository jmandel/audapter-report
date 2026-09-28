function lr_log_op(op)
% Append an Audapter/environment op to the pending op list; ops are attached to the trial that the next 'stop'
% closes (setup ops before the first start belong to trial 1's "pre" list).
global LR
op.t = LR.vclock; op.trial = LR.ntrial; op.running = lr_is_running();
if ~isfield(op, 'op'), op.op = '?'; end
LR.ops{end+1} = op;
if LR.echo_ops && LR.oplog > 0 && ~any(strcmp(op.op, {'getParam'}))
  f = setdiff(fieldnames(op), {'t', 'trial', 'running', 'op', 'text'});
  parts = {};
  for j = 1:numel(f)
    v = op.(f{j}); if isnumeric(v), v = mat2str(v, 6); elseif iscell(v), v = strjoin(cellfun(@(x) lr_str(x), v, 'UniformOutput', false), ', '); end
    parts{end+1} = sprintf('%s=%s', f{j}, lr_str(v));
  end
  fprintf(LR.oplog, '%.4f\t%d\t%d\t%s\t%s\n', op.t, op.trial, op.running, op.op, strjoin(parts, ' '));
end
end
function s = lr_str(x)
if ischar(x), s = x; elseif isnumeric(x), s = mat2str(x, 6); else, s = class(x); end
s = strrep(s, sprintf('\n'), '\n');
end
