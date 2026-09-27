#!/bin/bash
# Copy a TransShiftMex tree and apply MSVC->GCC portability fixes only (no behavioral changes).
# Usage: prep-src.sh <src-root rel to repo root> <dest-dir>
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
SRC="$ROOT/$1/TransShiftMex"; DST=$2
rm -rf "$DST"; mkdir -p "$DST"; cp "$SRC"/*.cpp "$SRC"/*.h "$DST"/
sed -i 's/(sizeof dtype)/(sizeof(dtype))/g' "$DST"/mexLibrary.cpp
# F-H1: DSPF_dp_blk_move uses memcpy on overlapping ranges (UB). MSVC's memcpy behaves like memmove,
# so memmove is the faithful emulation of the shipped Windows binary.
sed -i 's/    memcpy(r, x, nx \* sizeof(double));/    memmove(r, x, nx * sizeof(double));/' "$DST"/DSPF.cpp
grep -q 'memmove(r, x' "$DST"/DSPF.cpp || { echo "prep-src: memmove patch did not apply" >&2; exit 1; }
