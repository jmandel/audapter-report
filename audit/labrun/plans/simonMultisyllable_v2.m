% simonMulti Exp2 ("seven/sever/level"): run_simonMultisyllable_v2_expt, test mode unless LR_FULL=1.
plan.name = 'simonMultisyllable_v2';
plan.repos = {'simonMulti'};
plan.exptDir = 'simonMulti/experiment scripts/Exp2';
plan.entry = 'run_simonMultisyllable_v2_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'female';
% counterbalancing file: which of expt.shifts {0 1 -1} each of the two shifted words gets (up/down or down/up)
plan.pre = @() lr_make_cbperm(get_exptLoadPath('simonMultisyllable_v2'), 'simonMultisyllable_v2', {2 3; 3 2});
