function x = tinv(p, v)
% labrun compat (statistics toolbox tinv): inverse of Student's t CDF via the inverse incomplete beta function.
q = min(p, 1 - p); z = betaincinv(2 * q, v / 2, 0.5);
x = sign(p - 0.5) .* sqrt(v .* (1 ./ z - 1)); x(p == 0.5) = 0;
end
