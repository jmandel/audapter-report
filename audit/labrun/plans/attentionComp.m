% attentionAAF attentionComp (randomized catch-trial compensation): run_attentionComp_expt, test mode unless LR_FULL=1.
plan.name = 'attentionComp';
plan.repos = {'attentionAAF'};
plan.exptDir = 'attentionAAF';
plan.entry = 'run_attentionComp_expt';
plan.args = {struct('snum', 'lr001'), ~strcmp(getenv('LR_FULL'), '1')};
plan.gender = 'female';
plan.answers = {'Enter a coherence', ''};   % leave blank: run the coherence test
