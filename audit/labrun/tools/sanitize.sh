#!/bin/bash
# Replace the names of unpublished lab repositories (listed in the untracked audit/publish/private-patterns.local)
# with "<unpublished-repo>" in the text outputs of a public run. The public lab code refers to such a repo by name
# (e.g. as the folder its runner looks in), so the name would otherwise appear in paths in the logs.
#   tools/sanitize.sh RESULTDIR
L=$(cd "$(dirname "$0")/.." && pwd); P="$L/../publish/private-patterns.local"; D=$1
[[ -s "$P" ]] || exit 0
expr=$(sed -e 's/[.[\*^$/]/\\&/g' "$P" | paste -sd'|')
find "$D" -maxdepth 2 -type f \( -name '*.md' -o -name '*.tsv' -o -name '*.json' -o -name '*.log' -o -name '*.txt' -o -name '*.list' \) \
  -exec sed -i -E "s/(^|[^A-Za-z0-9_-])($expr)([^A-Za-z0-9_-]|$)/\1<unpublished-repo>\3/Ig; s/(^|[^A-Za-z0-9_-])($expr)([^A-Za-z0-9_-]|$)/\1<unpublished-repo>\3/Ig" {} +
