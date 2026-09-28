function v = lr_dotget(obj, prop)
% labrun (load-time transformation target): MATLAB obj.Prop for graphics handles (get) or structs/objects.
if isnumeric(obj) && ~isempty(obj) && all(ishghandle(obj(:)))
  if isscalar(obj), v = get(obj, prop); else, v = get(obj, prop); end
else
  v = obj.(prop);
end
end
