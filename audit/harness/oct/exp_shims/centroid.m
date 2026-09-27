function [cx, cy] = centroid(ps)
% Area centroid of a simple polygon (shoelace formula), matching MATLAB polyshape/centroid
% for the convex vowel quadrilaterals free-speech calc_pertField builds.
x = ps.x; y = ps.y; x2 = circshift(x, -1); y2 = circshift(y, -1);
a = x .* y2 - x2 .* y; A = sum(a) / 2;
cx = sum((x + x2) .* a) / (6 * A); cy = sum((y + y2) .* a) / (6 * A);
end
