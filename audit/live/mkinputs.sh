#!/bin/bash
# Generate stimuli + AudapterIO('init') traces into work/in (Octave, real blab AudapterIO.m)
cd "$(dirname "$0")"; mkdir -p work/in
./dock.sh "cd /live/oct && octave --no-gui --norc -q --eval \"pkg load signal; warning('off','all'); addpath('/live/oct'); addpath('/a/blab/audapter_matlab/mcode'); addpath('/a/audit/harness/oct'); mk_inputs\"" 2>&1 | grep -v "ignoring const execution_exception"
