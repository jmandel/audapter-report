function lr_quantum()
% Called on every read of a virtual clock (GetSecs, toc, clock, now, ...): advance by one quantum so that polling
% loops terminate. The quantum is one device frame while audio runs (so it is pumped like any other time), else 1 ms.
global LR
if lr_is_running(), lr_advance(LR.dev.frame / LR.dev.fsDev); else, lr_advance(LR.plan.idleQuantum); end
end
