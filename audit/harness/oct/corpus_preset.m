function s = corpus_preset(m)
% Audapter sex preset used for a corpus clip: 'male' for adult/teen male speakers, 'female' otherwise
% (children of both sexes and unknown-sex speakers get 'female', as is common lab practice).
if m.sex == 'M' && ~strcmp(m.group, 'child'), s = 'male'; else, s = 'female'; end
end
