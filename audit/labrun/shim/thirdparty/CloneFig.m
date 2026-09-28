function CloneFig(inFig, outFig)
% labrun stand-in for the File Exchange CloneFig (copies one figure's contents into another; the lab uses it to
% mirror the participant's screen on the experimenter's monitor). Display only.
try
  clf(outFig); copyobj(allchild(inFig), outFig);
catch
end
end
