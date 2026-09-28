% simonMulti Exp1 (coAdapt): run_coAdapt_expt, test mode unless LR_FULL=1.
plan.name = 'coAdapt';
plan.repos = {'simonMulti'};
plan.exptDir = 'simonMulti/experiment scripts/Exp1';
plan.entry = 'run_coAdapt_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'female';
% counterbalancing file: the 3! assignments of expt.shifts to the three words
plan.pre = @() lr_make_cbperm(get_exptLoadPath('coAdapt'), 'coAdapt', num2cell(perms([1 2 3])));
