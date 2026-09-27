#!/bin/bash
# usage: scan.sh owner/repo...
for r in "$@"; do
  info=$(gh api repos/$r --jq '"\(.default_branch) \(.license.spdx_id // "none") \(.size)"' 2>/dev/null) || { echo "== $r MISSING"; continue; }
  set -- $info; b=$1
  echo "== $r [lic=$2 sizeKB=$3]"
  gh api "repos/$r/git/trees/$b?recursive=1" --jq '(if .truncated then "TRUNCATED" else empty end), (.tree[] | select(.type=="blob") | select(.path|test("\\.(wav|flac|mat|aiff?|ogg|mp3|nsp|sph|au|snd|m4a)$";"i")) | "  \(.size) \(.path)")' 2>/dev/null | head -${MAXN:-25}
done
