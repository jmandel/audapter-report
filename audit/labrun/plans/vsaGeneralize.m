% vsaGeneralize (generalization of centralization, 2-D field): run_vsaGeneralize_expt, test mode unless LR_FULL=1.
plan.name = 'vsaGeneralize';
plan.repos = {'vsaGeneralize'};
plan.exptDir = 'vsaGeneralize';
plan.entry = 'run_vsaGeneralize_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'male';
