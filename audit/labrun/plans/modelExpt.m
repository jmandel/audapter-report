% free-speech template experiment (run_modelExpt_expt -> run_checkLPC -> run_measureFormants_audapter ->
% run_modelExpt_audapter), test mode, "perturbed" group.
plan.name = 'modelExpt';
plan.repos = {'free-speech'};
plan.exptDir = 'free-speech/templates/modelExpt';
plan.entry = 'run_modelExpt_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};   % test mode unless LR_FULL=1
plan.gender = 'female';
plan.answers = {'Which group', '2'; 'Run LPC check', '1'; 'LPC check recording good', 'yes'};
