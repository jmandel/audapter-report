function s = rendererinfo(varargin)
% labrun compat: MATLAB rendererinfo (figures are not rendered; reports the classic OpenGL renderer).
s = struct('GraphicsRenderer', 'OpenGL Hardware', 'Vendor', 'labrun', 'Version', '', 'RendererDevice', '', 'Details', struct());
end
