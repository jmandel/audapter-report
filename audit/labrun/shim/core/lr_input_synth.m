function [x, desc] = lr_input_synth(req, spec)
% Synthetic utterance of req.word: one Klatt-cascade vowel per vowel group (harness synth_vowel), with
% gender-typical formants (Hillenbrand et al. 1995 means) and F0, separated by short low-level gaps.
% spec fields (all optional): onset (s, default 0.30), vdur (s per single-syllable vowel, 0.30), sdur (per
% syllable in multi-syllable words, 0.18), gap (0.06), level (vowel RMS at the mic, 0.05), f0, jitter (1),
% vowels (override, cell of ARPAbet names), formants (override, [F1 F2 F3] rows), onsetLocus / offsetLocus
% ([F1 F2 F3] consonant loci: formants glide from/to them over glideDur s at each syllable's edges).
if ~isfield(req, 'durScale'), req.durScale = 1; req.levelScale = 1; end
o = struct('onsetLocus', [], 'offsetLocus', [], 'glideDur', 0.06, 'onset', 0.30, 'vdur', 0.30, 'sdur', 0.18, 'gap', 0.06, 'level', 0.05, 'f0', [], 'jitter', 1, 'vowels', {{}}, 'formants', [], 'tail', 0.25, 'maxsyl', 12);
f = fieldnames(spec); for j = 1:numel(f), o.(f{j}) = spec.(f{j}); end
male = strncmpi(req.gender, 'm', 1);
if isempty(o.f0), if male, o.f0 = 118; else, o.f0 = 205; end, end
if isempty(o.vowels), o.vowels = lr_word_vowels(req.word); end
V = o.vowels(1:min(end, o.maxsyl));
if isempty(o.formants), F = zeros(numel(V), 3); for j = 1:numel(V), F(j, :) = lr_vowel_formants(V{j}, male); end, else, F = o.formants; end
fs = req.fs; rs = rand('twister'); rand('twister', 1000 + req.k);
jit = @(v, r) v * (1 + o.jitter * r * (2 * rand - 1));
on = jit(o.onset, 0.15); n1 = size(F, 1);
if n1 == 1, durs = jit(o.vdur * req.durScale, 0.12); else, durs = arrayfun(@(i) jit(o.sdur * req.durScale, 0.12), 1:n1); end
rand('twister', rs);
seg = zeros(round(on * fs), 1);
BW = [80 100 150 200];
tot = sum(durs); tt = 0;
for j = 1:n1
  f0c = o.f0 * (1.04 - 0.08 * (tt + (0:round(durs(j) * fs) - 1)' / fs) / max(tot, 0.2));
  Fj = [F(j, :) F(j, 3) + 1000];
  if ~isempty(o.onsetLocus) || ~isempty(o.offsetLocus)   % consonant transitions
    ns = round(durs(j) * fs); Fj = repmat(Fj, ns, 1); g = min(ns, round(o.glideDur * fs)); w = linspace(1, 0, g)';
    if ~isempty(o.onsetLocus), L = [o.onsetLocus(:)' Fj(1, 4)]; Fj(1:g, :) = w .* L + (1 - w) .* Fj(1:g, :); end
    if ~isempty(o.offsetLocus), L = [o.offsetLocus(:)' Fj(1, 4)]; Fj(end-g+1:end, :) = flipud(w) .* L + (1 - flipud(w)) .* Fj(end-g+1:end, :); end
  end
  v = synth_vowel(fs, durs(j), f0c, Fj, BW, 'onset', 0, 'offset', 0, 'amp', 1, 'ramp', 0.02, 'noise', 0);
  v = v / sqrt(mean(v(round(0.2*end):round(0.8*end)).^2)) * o.level * req.levelScale;
  seg = [seg; v]; tt = tt + durs(j);
  if j < n1, seg = [seg; zeros(round(o.gap * fs), 1)]; end
end
x = [seg; zeros(round(o.tail * fs), 1)];
desc = sprintf('synth "%s" %s f0=%g vowels=%s onset=%.3f dur=%.3f level=%.3f', req.word, ifelse(male, 'male', 'female'), o.f0, strjoin(V, '-'), on, tot + (n1 - 1) * o.gap, o.level * req.levelScale);
end
function r = ifelse(c, a, b)
if c, r = a; else, r = b; end
end
