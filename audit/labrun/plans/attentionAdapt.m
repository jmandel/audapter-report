% attentionAAF attentionAdapt (dual-task adaptation): run_attentionAdapt_expt, test mode unless LR_FULL=1.
plan.name = 'attentionAdapt';
plan.repos = {'attentionAAF'};
plan.exptDir = 'attentionAAF';
plan.entry = 'run_attentionAdapt_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'female';
plan.pre = @() lr_make_cbperm(get_exptLoadPath('attentionAdapt'), 'attentionAdapt', {'dots', 'noDots'; 'noDots', 'dots'});
