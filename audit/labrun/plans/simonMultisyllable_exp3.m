% simonMulti Exp3 ("pedigree/pedicure/pedestal/carbonate"): run_simonMultisyllable_expt, test mode unless LR_FULL=1.
plan.name = 'simonMultisyllable_exp3';
plan.repos = {'simonMulti'};
plan.exptDir = 'simonMulti/experiment scripts/Exp3';
plan.entry = 'run_simonMultisyllable_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'female';
plan.pre = @() lr_make_cbperm(get_exptLoadPath('simonMultisyllable'), 'simonMultisyllable', {2 3; 3 2});
