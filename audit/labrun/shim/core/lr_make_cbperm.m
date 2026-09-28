function lr_make_cbperm(permDir, exptName, conds)
% Stand-in for the lab server's counterbalancing file: create cbPermutation_<expt>.mat in permDir with the lab's
% own gen_cbPermutation (conds: one permutation per row). Used from plan.pre hooks.
if ~exist(permDir, 'dir'), mkdir(permDir); end
gen_cbPermutation(permDir, exptName, conds);
lr_log_op(struct('op', 'plan:cbPermutation', 'dir', permDir, 'expt', exptName));
end
