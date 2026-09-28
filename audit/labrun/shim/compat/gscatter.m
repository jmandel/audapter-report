function h = gscatter(x, y, g, varargin)
% labrun compat (statistics toolbox gscatter, display only): one scatter series per group.
ax = gca; hold(ax, 'on'); [u, ~, k] = unique(g); h = zeros(numel(u), 1);
for i = 1:numel(u), h(i) = plot(ax, x(k == i), y(k == i), 'o'); end
end
