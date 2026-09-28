function r = lr_is_running()
global LR
r = isfield(LR, 'dev') && ~isempty(LR.dev) && LR.dev.running;
end
