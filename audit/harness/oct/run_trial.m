function d = run_trial(p, x, varargin)
% Run one offline Audapter trial through the real AudapterIO + Audapter('runFrame') path.
% x is at device rate (p.sr * p.downFact). Options: 'ost', 'pcf' file paths; 'init' (default true).
o = struct('ost', '', 'pcf', '', 'init', true, 'reset', true);
for k = 1:2:numel(varargin), o.(varargin{k}) = varargin{k+1}; end
if o.init, AudapterIO('init', p); end
if ~isempty(o.ost), Audapter('ost', o.ost, 0); end
if ~isempty(o.pcf), Audapter('pcf', o.pcf, 0); end
if o.reset, Audapter('reset'); end
N = p.frameLen * p.downFact; x = x(:);
x = [x; zeros(mod(-numel(x), N), 1)];
for k = 1:numel(x)/N
  fr = x((k-1)*N+1:k*N) + 0;  % fresh copy: runFrame mutates its input (finding H3)
  Audapter('runFrame', fr);
end
d = AudapterIO('getData');
end
