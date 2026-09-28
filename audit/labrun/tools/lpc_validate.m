% LPC-check rule validation on recordings: Audapter (getAudapterDefaultParams(gender), nLPC = 10..20, fb 1) run offline
% on each file; per vowel segment [t0 t1] (s) prints the median F1/F2 over its middle half and the frame-to-frame jump
% counts (|dF1| > 100 Hz or |dF2| > 200 Hz) over the whole segment. LIST (env) = TSV lines "path gender t0 t1 id".
% Run with the harness (audit/harness: BUILD/MCODE on the path, run_trial from harness/oct).
L = strsplit(strtrim(fileread(getenv('LIST'))), "\n");
printf('id\torder\tF1\tF2\tsteps\tjumps\n');
last = ''; 
for i = 1:numel(L)
  q = strsplit(L{i}, "\t"); f = q{1}; g = 'female'; if q{2}(1) == 'M', g = 'male'; end
  t0 = str2double(q{3}); t1 = str2double(q{4});
  if ~strcmp(f, last)
    [x, fx] = audioread(f); x = mean(x, 2); if fx ~= 48000, x = resample(x, 48000, fx); end
    x = x / sqrt(mean(x(abs(x) > 0.1 * max(abs(x))).^2)) * 0.05; last = f; D = cell(1, 11);   % level as labrun's participant
    for n = 10:20
      p = getAudapterDefaultParams(g); p.nLPC = n; d = run_trial(p, x); D{n - 9} = d;
    end
  end
  for n = 10:20
    d = D{n - 9}; fm = double(d.fmts(:, 1:2)); tc = ((1:size(fm, 1))' - 0.5) * d.params.frameLen / d.params.sr;
    a = t0 + 0.25 * (t1 - t0); b = t1 - 0.25 * (t1 - t0); k = tc >= a & tc <= b & fm(:, 1) > 0;
    kk = find(tc >= t0 & tc <= t1 & fm(:, 1) > 0); st = 0; jp = 0;
    if numel(kk) > 1, dd = abs(diff(fm(kk, :))); ok = diff(kk) == 1; st = sum(ok); jp = sum(ok & (dd(:, 1) > 100 | dd(:, 2) > 200)); end
    F = [NaN NaN]; if sum(k) >= 3, F = median(fm(k, :), 1); end
    printf('%s\t%d\t%.1f\t%.1f\t%d\t%d\n', q{5}, n, F(1), F(2), st, jp);
  end
end
