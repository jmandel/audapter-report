function spec = lr_token_spread(req, sd, outlierFrac, outlierSD, onsetLocus, offsetLocus)
% Synthetic-input spec with token-to-token formant variability: F1/F2 = the vowel's mean x exp(sd * z), z ~ N(0,1),
% with a fraction of tokens at +-outlierSD; optional consonant loci for formant transitions. Seeded by trial.
if nargin < 2, sd = 0.08; end
if nargin < 3, outlierFrac = 0.1; end
if nargin < 4, outlierSD = 2.5; end
if nargin < 5, onsetLocus = []; end
if nargin < 6, offsetLocus = []; end
V = lr_word_vowels(req.word); male = strncmpi(req.gender, 'm', 1);
F = zeros(numel(V), 3); for j = 1:numel(V), F(j, :) = lr_vowel_formants(V{j}, male); end
st = randn('state'); randn('state', 7000 + req.k); z = randn(1, 2);
st2 = rand('state'); rand('state', 9000 + req.k); if rand < outlierFrac, z = sign(z) * outlierSD; end
randn('state', st); rand('state', st2);
F(:, 1:2) = F(:, 1:2) .* exp(sd * z);
spec = struct('kind', 'synth', 'formants', F, 'onsetLocus', onsetLocus, 'offsetLocus', offsetLocus);
end
