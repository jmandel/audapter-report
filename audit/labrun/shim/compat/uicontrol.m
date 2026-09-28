function h = uicontrol(varargin)
% labrun compat: Octave's uicontrol after lr_fix_pv (MATLAB accepts 'String', []).
a = lr_fix_pv(varargin);
if nargout, h = lr_orig_uicontrol(a{:}); else, lr_orig_uicontrol(a{:}); end
end
