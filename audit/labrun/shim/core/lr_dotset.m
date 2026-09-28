function obj = lr_dotset(obj, prop, val, idx)
% labrun (load-time transformation target): MATLAB obj.Prop = val / obj.Prop(idx) = val for graphics handles
% (set) or structs/objects.
if isnumeric(obj) && ~isempty(obj) && all(ishghandle(obj(:)))
  if nargin > 3, cur = get(obj, prop); cur(idx{:}) = val; val = cur; end
  set(obj, prop, val);
else
  if nargin > 3, cur = obj.(prop); cur(idx{:}) = val; val = cur; end
  obj.(prop) = val;
end
end
