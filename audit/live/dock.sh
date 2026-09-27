#!/bin/bash
# Run a command inside the audapter-live image with the live dir at /live (rw) and the repo root at /a (ro).
# Environment variables named FAKEASIO_*, TSAN_OPTIONS, ASAN_OPTIONS, UBSAN_OPTIONS are passed through.
cd "$(dirname "$0")"
ENVS=""; for v in $(env | grep -oE '^(FAKEASIO_[A-Z_]+|TSAN_OPTIONS|ASAN_OPTIONS|UBSAN_OPTIONS)='); do ENVS="$ENVS -e ${v%=}"; done
exec docker run --rm $DOCK_EXTRA $ENVS -e MPLCONFIGDIR=/tmp -e HOME=/tmp -u $(id -u):$(id -g) -v "$(cd .. && cd .. && pwd)":/a:ro -v $PWD:/live -w /live audapter-live bash -c "$*"
