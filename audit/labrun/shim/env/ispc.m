function r = ispc()
% labrun: the lab rigs run Windows, so lab code takes its Windows branches (Octave's own code gets the truth).
r = ~lr_from_octave(1);
end
