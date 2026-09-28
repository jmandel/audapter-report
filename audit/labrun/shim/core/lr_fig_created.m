function lr_fig_created(h, varargin)
% Root default CreateFcn for figures: add MATLAB-only figure properties the lab code sets or reads.
props = {'WindowState', 'normal'; 'AutoResizeChildren', 'on'; 'Scrollable', 'off'};
for j = 1:size(props, 1)
  if ~isprop(h, props{j, 1}), try, addproperty(props{j, 1}, h, 'any', props{j, 2}); catch, end, end
end
end
