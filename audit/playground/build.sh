#!/bin/bash
# Build the Audapter Playground into audit/playground/dist/ (self-contained static site; works over https and file://).
# Needs node >= 20. Uses the prebuilt WASM bundles in audit/wasm/lib (rebuild them with audit/wasm/build.sh full lite patched)
# and, if installed, the `flac` encoder to shrink the bundled clips losslessly (falls back to WAV).
set -euo pipefail
cd "$(dirname "$0")"
node tools/build.mjs "$@"
