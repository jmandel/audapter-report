#!/bin/bash
# Rebuild everything from the pinned sources. Requires docker, git, python3, node >= 20.
set -euo pipefail
cd "$(dirname "$0")"
git submodule update --init
docker build -q -t audapter-octave audit/harness/docker
audit/harness/run-tests.sh --rebuild | tee audit/harness/logs-summary.txt
[[ -x audit/wasm/build.sh ]] && audit/wasm/build.sh
python3 audit/report/build.py --single
audit/publish/stage.sh
