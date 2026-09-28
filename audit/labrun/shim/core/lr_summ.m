function s = lr_summ(v)
% Compact, loggable form of an argument: scalars/short vectors verbatim, long arrays summarised (+ hash).
if ischar(v), s = v; return; end
if islogical(v), v = double(v); end
if isnumeric(v)
  v = double(v);
  if numel(v) <= 16, s = v(:)'; return; end
  u = unique(v(:));
  if numel(u) == 1, s = sprintf('[%d x %s]', numel(v), num2str(u, 8)); return; end
  s = sprintf('[%dx%d min %.6g max %.6g mean %.6g rms %.6g hash %s]', size(v,1), size(v,2), min(v(:)), max(v(:)), mean(v(:)), sqrt(mean(v(:).^2)), lr_hash(v));
  return
end
if iscell(v), s = sprintf('{cell %dx%d}', size(v,1), size(v,2)); return; end
if isstruct(v), s = sprintf('{struct %s}', strjoin(fieldnames(v)', ',')); return; end
s = class(v);
end
