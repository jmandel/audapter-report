#!/usr/bin/env bash
# Re-fetch the ORIGINAL sources of every committed (redistributable) corpus clip from stable URLs,
# verify them against tools/sources.lock.json, rebuild the clips/refs/ground truth with the pinned
# toolchain, and verify the rebuild against the committed files (sha256 in manifest.csv + byte compare).
#
#   ./fetch.sh              fetch + rebuild into .cache/rebuild + verify (does not touch committed files)
#   ./fetch.sh --install    ...then copy the rebuild over audio/ gt/ ref/ licenses/ manifest.*
#
# Needs: bash, curl, python3.12 via `uv` (preferred) or python3 -m venv, ~45 MB download (range requests
# are used for zip members and parquet rows, so the large source archives are never downloaded whole).
# The licence-restricted Hillenbrand data are separate: see fetch_restricted.sh.
set -euo pipefail
HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CACHE="$HERE/.cache"; mkdir -p "$CACHE"; echo '*' > "$CACHE/.gitignore"   # cache ignores itself
PY="$CACHE/.venv/bin/python"
die() { echo "fetch.sh: ERROR: $*" >&2; exit 1; }

if [[ ! -x $PY ]] || ! "$PY" -c 'import parselmouth, remotezip, pyarrow' 2>/dev/null; then
  if command -v uv >/dev/null; then
    uv venv -q --python 3.12 "$CACHE/.venv" && uv pip install -q --python "$PY" -r "$HERE/tools/requirements.txt"
  else
    python3 -m venv "$CACHE/.venv" && "$PY" -m pip install -q -r "$HERE/tools/requirements.txt"
  fi || die "could not create the python environment"
fi

cat <<'TERMS'
Sources and licences (details per clip in manifest.csv; attribution in README.md):
  CMU ARCTIC (festvox licence, keep notice: licenses/CMU_ARCTIC_COPYING.txt) | speechocean762, LibriSpeech,
  VoiceBank-DEMAND, PVQD, VocalSet, vocadito (CC BY 4.0) | Audapter example trials (MIT / Apache-2.0) |
  elainekearney/audapter_matlab, carrien/free-speech (MIT) | Praat test sounds (GPL-3.0-or-later)
TERMS

"$PY" "$HERE/tools/fetch_sources.py" "$CACHE" || die "source download/verification failed"
rm -rf "$CACHE/rebuild"
"$PY" "$HERE/tools/build_corpus.py" "$CACHE/raw" "$CACHE/rebuild" > "$CACHE/build.log" 2>&1 || { tail "$CACHE/build.log"; die "build failed"; }

# verify: every clip's sha256 against the committed manifest, then a byte compare of everything
"$PY" - "$HERE/manifest.csv" "$CACHE/rebuild" <<'EOF' || die "rebuilt clips do not match manifest.csv"
import csv, hashlib, os, sys
bad = 0; rows = list(csv.DictReader(open(sys.argv[1])))
for r in rows:
    p = os.path.join(sys.argv[2], r['path'])
    h = hashlib.sha256(open(p, 'rb').read()).hexdigest() if os.path.exists(p) else 'MISSING'
    if h != r['sha256']: print('MISMATCH', r['id'], h, r['sha256']); bad += 1
print('%d clips checked against manifest.csv, %d mismatches' % (len(rows), bad)); sys.exit(1 if bad else 0)
EOF
if [[ ${1:-} == --install ]]; then
  for d in audio gt ref licenses; do rm -rf "${HERE:?}/$d"; cp -r "$CACHE/rebuild/$d" "$HERE/$d"; done
  cp "$CACHE/rebuild"/manifest.* "$HERE/"
  echo "installed rebuilt corpus into ${HERE}"
else
  for d in audio gt ref licenses; do diff -rq "$HERE/$d" "$CACHE/rebuild/$d" || die "committed $d/ differs from rebuild (run with --install to restore)"; done
  for f in manifest.csv manifest.json manifest.tsv; do cmp -s "$HERE/$f" "$CACHE/rebuild/$f" || die "committed $f differs from rebuild"; done
  echo "OK: all committed corpus files are reproduced byte-for-byte from the original sources."
fi
