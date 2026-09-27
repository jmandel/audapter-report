function T(name, ok, varargin)
% Test assertion reporter: prints a greppable PASS/FAIL line.
msg = ''; if ~isempty(varargin), msg = sprintf(varargin{:}); end
if ok, s = 'PASS'; else s = 'FAIL'; end
printf('%s  %-45s %s\n', s, name, msg);
end
