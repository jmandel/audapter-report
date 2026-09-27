#!/bin/bash
# Build all harness variants.
cd "$(dirname "$0")"
./build-oct.sh blab/audapter_mex build-oct >/dev/null &
./build-oct.sh upstream/audapter_mex build-upstream >/dev/null &
./build-oct.sh blab/audapter_mex build-asan "-O1 -fno-omit-frame-pointer -fsanitize=address,undefined -fno-sanitize=vptr" >/dev/null &
wait; ls -la build-*/Audapter.mex
