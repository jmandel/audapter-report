function [actual, diffs, src, full] = lr_param_check(ctx)
% actual: getParam of every parameter AudapterIO('init') can send (long arrays summarised); full: the same, numeric.
% diffs:  the lab script's intended parameter struct (p, params or expt.audapterParams, from its workspace) vs
%         what Audapter reports. Kinds: 'mismatch' (sent value differs from the struct's now), 'not-forwarded'
%         (Audapter has a parameter of that name but AudapterIO('init') never sends the field and the script
%         never set it directly), 'unknown' (no Audapter parameter of that name; informational).
global LR
actual = struct(); full = struct(); diffs = {}; src = '';
for j = 1:size(LR.pmap, 1)
  a = LR.pmap{j, 2};
  if isfield(actual, a) || any(strcmp(a, {'datapb'})), continue; end
  try, v = double(AudapterReal('getParam', a)); catch, continue; end
  actual.(a) = lr_summ(v); full.(a) = v;
end
p = [];
if isfield(ctx, 'p') && isstruct(ctx.p) && isfield(ctx.p, 'frameLen'), p = ctx.p; src = 'p';
elseif isfield(ctx, 'params') && isstruct(ctx.params) && isfield(ctx.params, 'frameLen'), p = ctx.params; src = 'params';
elseif isfield(ctx, 'expt') && isstruct(ctx.expt) && isfield(ctx.expt, 'audapterParams'), p = ctx.expt.audapterParams; src = 'expt.audapterParams';
end
if isempty(p), return; end
f = fieldnames(p);
for j = 1:numel(f)
  v = p.(f{j});
  if ~(isnumeric(v) || islogical(v)) || isempty(v), continue; end
  m = find(strcmp(LR.pmap(:, 1), f{j}), 1);
  if ~isempty(m)
    a = LR.pmap{m, 2};
    if any(strcmp(a, {'datapb', 'timedomainpitchshiftschedule'})), continue; end
    try, act = double(AudapterReal('getParam', a)); catch, continue; end
    if isempty(act), continue; end                   % not readable through getParam
    if ~lr_same(double(v), act)
      diffs{end+1} = struct('kind', 'mismatch', 'field', f{j}, 'param', a, 'intended', lr_summ(double(v)), 'actual', lr_summ(act));
    end
  else
    a = lower(f{j});
    try, act = double(AudapterReal('getParam', a)); known = true; catch, known = false; end
    if known
      if any(strcmp(LR.setNames, a))
        if ~lr_same(double(v), act)
          diffs{end+1} = struct('kind', 'mismatch-direct', 'field', f{j}, 'param', a, 'intended', lr_summ(double(v)), 'actual', lr_summ(act));
        end
      elseif ~lr_same(double(v), act)
        diffs{end+1} = struct('kind', 'not-forwarded', 'field', f{j}, 'param', a, 'intended', lr_summ(double(v)), 'actual', lr_summ(act));
      end
    else
      if any(strcmp(f{j}, {'timeDomainPitchShiftSchedule', 'timeDomainPitchShiftAlgorithm'})), continue; end   % sent in a reshaped form
      kind = 'unknown'; if any(strcmp(LR.defaultFields, f{j})), kind = 'unknown-default'; end
      diffs{end+1} = struct('kind', kind, 'field', f{j}, 'param', '', 'intended', lr_summ(double(v)), 'actual', '');
    end
  end
end
end
function r = lr_same(a, b)
a = a(:); b = b(:);
if numel(a) ~= numel(b)
  if numel(a) < numel(b) && all(b(numel(a)+1:end) == 0), b = b(1:numel(a)); else, r = false; return; end
end
r = all(abs(a - b) <= 1e-6 * max(1, abs(a)) | (isnan(a) & isnan(b)));
end
