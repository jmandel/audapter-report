% free-speech modelComp template (randomized compensation): run_modelComp_expt, test mode unless LR_FULL=1.
plan.name = 'modelComp';
plan.repos = {'free-speech'};
plan.exptDir = 'free-speech/templates/modelExpt';
plan.entry = 'run_modelComp_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'female';
plan.answers = {'Run LPC check', '0'};   % test mode with the LPC check hits an undefined exptPre in the template
