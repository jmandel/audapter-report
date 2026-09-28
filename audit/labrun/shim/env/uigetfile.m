function [f, p, idx] = uigetfile(varargin)
% labrun: answered from the plan; default = cancel (0).
a = lr_ask('uigetfile', strjoin(cellfun(@(x) char(x), varargin(cellfun(@ischar, varargin)), 'UniformOutput', false), ' '), {}, '');
if isempty(a), f = 0; p = 0; idx = 0; else, [p, n, e] = fileparts(a); f = [n e]; p = [p filesep]; idx = 1; end
end
