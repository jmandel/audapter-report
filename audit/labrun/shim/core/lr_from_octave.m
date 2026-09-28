function r = lr_from_octave(level)
% True if the function `level` frames up the stack (1 = the caller of the shim that calls this) is Octave's
% own library code, so platform shims (ispc/ismac/isunix) answer truthfully for Octave internals.
st = dbstack('-completenames');
r = numel(st) > level + 1 && strncmp(st(level + 2).file, '/usr/share/octave', 17);
end
