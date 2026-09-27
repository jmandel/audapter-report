function s = report_settings(p, gender, varargin)
% The exact settings a report example used, for the card's "Settings used" panel, its JSON download and its
% Playground link. p is the struct passed to AudapterIO('init'); every field that differs from
% getAudapterDefaultParams(gender) is listed with its value (long arrays are summarised). Name/value pairs add:
%   'ost', text | 'pcf', text | 'pcf_catch', text   OST/PCF file contents as loaded
%   'setparam', struct                               values sent with Audapter('setParam') outside init
%   'sequence', cellstr                              trial sequence, e.g. {'shift', 'shift', 'catch', ...}
%   'switching', text                                how the condition changes between trials
%   'build', text                                    'shipped' (blab @169cadf) unless stated
d = getAudapterDefaultParams(gender);
s = struct('preset', gender, 'build', 'shipped', 'params', struct(), 'setparam', struct(), 'ost', '', 'pcf', '', ...
           'sequence', {{}}, 'switching', '');
f = fieldnames(p);
for i = 1:numel(f)
  k = f{i}; v = p.(k);
  if isfield(d, k) && isequal(d.(k), v), continue; end
  s.params.(k) = summarise(v);
end
for i = 1:2:numel(varargin)
  k = varargin{i}; v = varargin{i+1};
  if strcmp(k, 'setparam')
    g = fieldnames(v); for j = 1:numel(g), s.setparam.(g{j}) = summarise(v.(g{j})); end
  else
    if iscell(v) && numel(v) == 1 && iscell(v{1}), v = v{1}; end   % f('sequence', {c}) passes {c}
    s.(k) = v;
  end
end
end

function v = summarise(v)
% Scalars and short vectors as they are; long arrays as a readable summary string.
if ischar(v) || numel(v) <= 8, return; end
u = unique(v(:));
if numel(u) == 1
  v = sprintf('%g (all %d values)', u, numel(v));
else
  v = sprintf('%d values, %g to %g', numel(v), min(v(:)), max(v(:)));
end
end
