function p = lr_genpath(d)
% genpath without .git folders (Octave's genpath already skips private/, @class and +package folders).
parts = strsplit(genpath(d), pathsep);
parts = parts(~cellfun(@isempty, parts) & cellfun(@isempty, regexp(parts, '[\\/]\.git', 'once')));
p = strjoin(parts, pathsep);
end
