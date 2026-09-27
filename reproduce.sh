#!/bin/bash
# Rebuild and re-verify everything from the pinned sources, in dependency order.
# Requires docker, git, python3 (numpy, pyyaml, matplotlib), node >= 20, npm, and Chromium at /usr/bin/chromium. Several hours in total, mostly the live stage.
#
# Usage: ./reproduce.sh [stage ...]      default: all stages in order
# Stages:
#   harness  build the Octave images/MEX builds and run the harness suite (expected FAILs = confirmed bugs)
#   wasm     export native reference runs, build the WASM variants, check equivalence and patches
#   formal   quick formal re-check (CBMC on pinned snippets, Lean, exact OLA gain); `audit/formal/run.sh sweep` is hours
#   live     live-path simulation (fake ASIO + RtAudio, TSan/ASan); the reset-burst step is probabilistic
#   report   build the report's WASM variants, verify patches, re-export assets, render, screenshot-check
#   publish  stage docs/ and run the public-information gate
set -euo pipefail
cd "$(dirname "$0")"
STAGES=${*:-harness wasm formal live report publish}
has() { [[ " $STAGES " == *" $1 "* ]]; }
step() { echo; echo "=== $*"; }

git submodule update --init
step "node tools (playwright-core)"; npm install --silent --no-audit --no-fund --prefix audit/scratch/wasm
step "docker image audapter-octave"; docker build -q -t audapter-octave audit/harness/docker

if has harness; then
  step "harness"; audit/harness/run-tests.sh --rebuild | tee audit/harness/logs-summary.txt
fi
if has wasm; then
  step "wasm: native reference exports"; audit/wasm/export.sh
  step "wasm: build variants";           audit/wasm/build.sh
  step "wasm: equivalence + patches";    (cd audit/wasm && EQUIV_TOL=1 node test/equiv.mjs full && EQUIV_TOL=1 node test/equiv.mjs lite && node test/patches.mjs)
fi
if has formal; then
  step "formal"; (cd audit/formal && ./run.sh)
fi
if has live; then
  step "live (long)"; audit/live/run.sh
fi
if has report; then
  step "report: WASM variants";   audit/report/wasm/build-variants.sh
  step "report: patch checks";    node audit/report/wasm/check-patches.mjs
  step "report: export + render"; python3 audit/report/build.py --export --single
  step "report: render check";    node audit/report/check-render.mjs
fi
if has publish; then
  step "publish gate"; audit/publish/stage.sh
fi
echo; echo "reproduce: done ($STAGES)"
