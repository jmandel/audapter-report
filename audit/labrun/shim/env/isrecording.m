function r = isrecording(id)
global LR
R = LR.recorders{id - 2e6}; r = R.active && LR.ptb0 + LR.vclock < R.tEnd;
end
