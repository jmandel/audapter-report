function delete(varargin)
% labrun compat: MATLAB's delete of an already deleted graphics object is a no-op; Octave errors. Numeric
% arguments: only the handles that still exist are deleted. File names go to Octave's delete (lr_orig_delete).
if nargin >= 1 && isnumeric(varargin{1})
  h = varargin{1}; h = h(ishghandle(h)); if ~isempty(h), __go_delete__(h); end
  return
end
lr_orig_delete(varargin{:});
end
