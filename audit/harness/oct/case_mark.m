function case_mark(name)
% Marks the start of a named section of the session for the Playground test-case capture
% (audit/playground/capture); case_mark('') ends it. Outside a capture run this does nothing.
global CASESEC
CASESEC = name;
end
