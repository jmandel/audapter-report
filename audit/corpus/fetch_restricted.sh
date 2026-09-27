#!/usr/bin/env bash
# Fetch the LICENSE-RESTRICTED Hillenbrand et al. (1995) vowel database into audit/corpus/restricted/hillenbrand/
# (gitignored; never commit it). Used by harness/oct/corpus_hillenbrand.m.
#
# - Source: the public re-host at github.com/santiagobarreda/hillenbrand_et_al_1995 (pinned commit), which
#   ships the original distribution as one zip, h95-alldata.zip. The original page
#   (homepages.wmich.edu/~hillenbr/voweldata.html) now redirects to a university login.
# - Verifies every file against a pinned sha256; unzips; rebuilds wav/ and index.tsv; verifies index.tsv.
# - Idempotent: does nothing if everything is already present and verifies.
# - Fails loudly (non-zero exit) on a checksum mismatch, a moved/missing URL, or a missing tool.
set -euo pipefail
HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DEST="$HERE/restricted/hillenbrand"
COMMIT=6dd44decc8ef5b537cbb54732a3b00c8fa652e65
URL="https://raw.githubusercontent.com/santiagobarreda/hillenbrand_et_al_1995/$COMMIT/h95-alldata.zip"
declare -A SHA=(
  [h95.zip]=2560548591e3a726c88549b6dc9d226995616c26874d601c69fee8b9eee9d730
  [men.zip]=bafe72aac7b1184fa440f4c14ad10421adb8223571fa7284b729dfde446b90a6
  [women.zip]=5c81c7e1ace6ef01e997e40a35c5398a3d5391216ba657eafccfdf7889b9b7a6
  [kids.zip]=11dcd73679997f689d7ed8f5281fd7ab8bf339036de018bd1c4dc2a5eef1be81
  [vowdata.dat]=05a4a69e2c6b0f444077245b1427d12bc86f8d7a32ae7a4b63f7e06e5712e4b1
  [bigdata.dat]=cebc484484c100cdd67dd191ad33dbb4ed2e8d59e11cc8a9dc23e2df2ef23dad
  [timedata.dat]=466b3ae1c02d1e8507da6146b1a019a2227646488cab4605c1b00437053bd250
  [iddata.dat]=52f48f4a951941d486c7b59afbe57a6f4fb5b3f0bbcd9cace8080d3da20d1856
  [misid.dat]=37e762f948d5a96c6da590e8a35acfe549d1972c633a2df838a3c890581bbb1f
  [vowdata.ds]=8d9c75980d2b0c1cd64b928c9c13de519eafffc66d8c1ac64a9b0fc01af20d14
  [readme.txt]=c499159d8b7a4eb1dae55607dd2b3569891c17feb6f36eb110f204b5a62ccdc4
)
INDEX_SHA=91a05512b34e1c85d2512648720c6f9baee53929df921c34495f45bcfe0c39e9
NWAV=1668

die() { echo "fetch_restricted.sh: ERROR: $*" >&2; exit 1; }
for t in curl unzip sha256sum python3; do command -v $t >/dev/null || die "missing tool: $t"; done
ok() { [[ -f "$DEST/$1" ]] && [[ $(sha256sum "$DEST/$1" | cut -d' ' -f1) == "${SHA[$1]}" ]]; }
all_ok() {
  for f in "${!SHA[@]}"; do ok "$f" || return 1; done
  [[ -f "$DEST/index.tsv" ]] && [[ $(sha256sum "$DEST/index.tsv" | cut -d' ' -f1) == "$INDEX_SHA" ]] || return 1
  [[ $(find "$DEST/wav" -name '*.wav' 2>/dev/null | wc -l) -eq $NWAV ]]
}

if all_ok; then echo "Hillenbrand (1995) data already present and verified in ${DEST#$HERE/}; nothing to do."; exit 0; fi

cat <<'TERMS'
==============================================================================================
 Hillenbrand, Getty, Clark & Wheeler (1995), "Acoustic characteristics of American English
 vowels", J. Acoust. Soc. Am. 97(5), 3099-3111. https://doi.org/10.1121/1.411872
 Data (c) 1995 James Hillenbrand. Re-hosted by Santiago Barreda "with permission from Jim
 Hillenbrand" (github.com/santiagobarreda/hillenbrand_et_al_1995; the repository's MIT licence
 names Barreda as copyright holder and does not clearly cover the recordings).
 TERMS OF USE: the original distribution states no licence or redistribution terms. Treat it as
 research use only: do NOT commit, re-host or ship these files (audit/corpus/restricted/ is
 gitignored). Cite the paper above in any work that uses them.
==============================================================================================
TERMS

mkdir -p "$DEST"
if ! ok h95.zip; then
  echo "downloading $URL"
  code=$(curl -sS -L -o "$DEST/h95.zip.part" -w '%{http_code}' "$URL") || die "download failed: $URL"
  [[ $code == 200 ]] || { rm -f "$DEST/h95.zip.part"; die "HTTP $code for $URL (moved or removed?)"; }
  mv "$DEST/h95.zip.part" "$DEST/h95.zip"
fi
ok h95.zip || die "checksum mismatch for h95.zip (got $(sha256sum "$DEST/h95.zip" | cut -d' ' -f1)); upstream changed?"
(cd "$DEST" && unzip -o -q h95.zip)
for f in "${!SHA[@]}"; do ok "$f" || die "checksum mismatch or missing after unzip: $f"; done
mkdir -p "$DEST/wav"
for z in men women kids; do unzip -o -q "$DEST/$z.zip" -d "$DEST/wav"; done
n=$(find "$DEST/wav" -name '*.wav' | wc -l); [[ $n -eq $NWAV ]] || die "expected $NWAV wav files, found $n"
python3 "$HERE/tools/hillenbrand_index.py" "$DEST"
[[ $(sha256sum "$DEST/index.tsv" | cut -d' ' -f1) == "$INDEX_SHA" ]] || die "index.tsv does not match the pinned checksum"
all_ok || die "verification failed"
echo "OK: Hillenbrand (1995) data verified in ${DEST#$HERE/} ($n wav files, index.tsv)."
