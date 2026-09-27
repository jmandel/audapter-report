# Publishing
Target: public repo **jmandel/audapter-report**, served by GitHub Pages. Authorized by Josh Mandel on 2026-09-27,
with the condition that it is based purely on public information (the open-source repos analysed).
Decisions (2026-09-27):
- Publish only when the full report is done (all planned cards; formal, WASM, live-path and corpus lines folded in and verified).
- No advance heads-up to the blab-lab maintainers; publish directly.
- Byline: "Claude (Anthropic)", with no model version string in the repo.
Procedure: `./stage.sh` builds publish/site/ and runs the public-information gate (private-repo names, local
paths, model ids, tokens, emails, file sizes). Push only on GATE PASS.

## Pre-publish TODO (full report build)
- Switch report/wasm/build-variants.sh to the wasm/ line's `lib/audapter-{full,patched}.js` (or wasm/build.sh variants).
  The report's current "lite" build also shrinks the playback buffer, which moves the I-01 loop point.
- Fold in the formal, live-path and corpus results once they have been verified.
- Methods byline/note per report/PLAN.md §12 item 1; confirm what Josh reviewed.
