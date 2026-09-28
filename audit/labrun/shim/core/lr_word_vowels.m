function V = lr_word_vowels(w)
% ARPAbet-ish vowel sequence for a stimulus word/text: a small table of the lab's usual words, else a
% letter-based guess per vowel group. Unknown / empty text -> {'AH'}.
w = lower(regexprep(char(w), '<[^>]*>', ''));
tab = struct('bed', 'EH', 'head', 'EH', 'dead', 'EH', 'fed', 'EH', 'said', 'EH', 'bet', 'EH', 'pet', 'EH', 'beg', 'EH', 'ted', 'EH', 'led', 'EH', 'red', 'EH', 'wed', 'EH', 'shed', 'EH', 'sled', 'EH', 'bread', 'EH', ...
  'bid', 'IH', 'did', 'IH', 'hid', 'IH', 'kid', 'IH', 'lid', 'IH', 'bit', 'IH', 'pit', 'IH', 'big', 'IH', ...
  'bad', 'AE', 'bat', 'AE', 'had', 'AE', 'dad', 'AE', 'sad', 'AE', 'mad', 'AE', 'pat', 'AE', 'bag', 'AE', 'cat', 'AE', 'tap', 'AE', 'cap', 'AE', 'gap', 'AE', 'sap', 'AE', 'map', 'AE', 'nap', 'AE', 'lap', 'AE', ...
  'bead', 'IY', 'heed', 'IY', 'beet', 'IY', 'seed', 'IY', 'deed', 'IY', 'need', 'IY', 'bee', 'IY', ...
  'bod', 'AA', 'hod', 'AA', 'cod', 'AA', 'pot', 'AA', 'god', 'AA', 'odd', 'AA', 'bob', 'AA', 'top', 'AA', ...
  'bud', 'AH', 'hud', 'AH', 'cut', 'AH', 'but', 'AH', 'mud', 'AH', 'dud', 'AH', 'bug', 'AH', 'cup', 'AH', ...
  'booed', 'UW', 'food', 'UW', 'boot', 'UW', 'who', 'UW', 'hood', 'UH', 'book', 'UH', 'good', 'UH', 'bode', 'OW', 'boat', 'OW', 'bird', 'ER', 'bayed', 'EY', 'bade', 'EY', 'ahh', 'AA', 'ah', 'AA', 'aaa', 'AA', 'eee', 'IY');
words = regexp(w, '[a-z]+', 'match');
V = {};
for i = 1:numel(words)
  if isfield(tab, words{i}), V{end+1} = tab.(words{i}); continue; end
  w2 = words{i}; hit = false;   % compounds of two known words ("bedhead")
  for c = 2:numel(w2) - 1, if isfield(tab, w2(1:c)) && isfield(tab, w2(c+1:end)), V(end+1:end+2) = {tab.(w2(1:c)), tab.(w2(c+1:end))}; hit = true; break; end, end
  if hit, continue; end
  g = regexp(words{i}, '[aeiouy]+', 'match');
  if numel(g) > 1 && strcmp(g{end}, 'e') && words{i}(end) == 'e', g = g(1:end-1); end
  for j = 1:numel(g)
    switch g{j}
      case {'ee', 'ea', 'ie', 'ei'}, V{end+1} = 'IY';
      case {'oo', 'ou', 'ue'}, V{end+1} = 'UW';
      case {'ai', 'ay', 'ey'}, V{end+1} = 'EY';
      case {'oa', 'ow', 'oe'}, V{end+1} = 'OW';
      otherwise
        switch g{j}(1)
          case 'a', V{end+1} = 'AE'; case 'e', V{end+1} = 'EH'; case 'i', V{end+1} = 'IH';
          case 'o', V{end+1} = 'AA'; case 'u', V{end+1} = 'AH'; otherwise, V{end+1} = 'IH';
        end
    end
  end
end
if isempty(V), V = {'AH'}; end
end
