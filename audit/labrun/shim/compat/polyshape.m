function ps = polyshape(x, y)
% Minimal Octave stand-in for MATLAB's polyshape, only for free-speech calc_pertField:
% polyshape({xs}, {ys}) -> struct with vertex lists. Used with centroid.m. (From audit/harness/oct/exp_shims.)
if iscell(x), x = x{1}; end
if iscell(y), y = y{1}; end
ps = struct('x', double(x(:)), 'y', double(y(:)));
end
