function y = randsample(n, k, replace, w)
% labrun compat (statistics toolbox randsample): k values from 1:n (or from the vector n), without replacement
% unless replace is true; optional weights w (with replacement).
if isscalar(n), pop = 1:n; else, pop = n; end
if nargin < 3 || isempty(replace), replace = false; end
if nargin >= 4 && ~isempty(w)
  c = cumsum(w(:)) / sum(w); idx = arrayfun(@(u) find(u <= c, 1), rand(k, 1));
elseif replace, idx = randi(numel(pop), k, 1);
else, idx = randperm(numel(pop), k);
end
y = pop(idx); if isrow(pop) && k > 1, y = y(:)'; end
end
