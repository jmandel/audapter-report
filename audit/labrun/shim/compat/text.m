function h = text(varargin)
% labrun compat: MATLAB's text also takes a struct of property/value pairs (the lab's txtparams); expanded here,
% then Octave's own text (lr_orig_text) is called.
a = {};
for j = 1:numel(varargin)
  v = varargin{j};
  if isstruct(v) && isscalar(v), f = fieldnames(v); for k = 1:numel(f), a(end+1:end+2) = {f{k}, v.(f{k})}; end
  else, a{end+1} = v; end
end
hh = lr_orig_text(a{:});
try, lr_saw_text(get(hh, 'String')); catch, end
if nargout, h = hh; end
end
