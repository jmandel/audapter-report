% vsaCentralize public entry run_vsaAdapt2_expt, test mode unless LR_FULL=1.
plan.name = 'vsaAdapt2';
plan.repos = {'vsaCentralize'};
plan.exptDir = 'vsaCentralize';
plan.entry = 'run_vsaAdapt2_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'male';
