function P = corpus_phones(f)
% Read an ARCTIC phone csv (start,end,phone) -> struct with fields t0, t1, ph (cell).
fid = fopen(f); P = struct('t0', [], 't1', [], 'ph', {{}});
l = fgetl(fid); while l(1) == '#', l = fgetl(fid); end
while true
  l = fgetl(fid); if ~ischar(l), break; end
  c = strsplit(l, ','); P.t0(end+1) = str2double(c{1}); P.t1(end+1) = str2double(c{2}); P.ph{end+1} = strtrim(c{3});
end
fclose(fid);
end
