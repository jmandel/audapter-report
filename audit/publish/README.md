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
- Repo = the repo root (git, local only so far). Sources are submodules pinned to the audited SHAs; the site is in /docs
  (GitHub Pages: deploy from branch main, folder /docs). Create the remote with
  `gh repo create jmandel/audapter-report --public --source . --push`, then enable Pages on /docs.
- Before pushing:
  - choose a license for audit/ and docs/ (README says TBD)
  - verify every committed corpus clip's license in audit/corpus/manifest allows redistribution
  - replace remaining the repo root paths in the live/, formal/, wasm/, corpus scripts and notes with repo-relative ones
  - rerun `./reproduce.sh` from a fresh `git clone --recurse-submodules` to prove it works elsewhere

## Published (2026-09-27)
- Repo: https://github.com/jmandel/audapter-report (public). Site: https://joshuamandel.com/audapter-report/
  (GitHub Pages from main:/docs, HTTPS enforced). The live index.html was verified byte-identical to docs/index.html.
- Before the first push, local history was rewritten to remove names of private repositories that had appeared in an early
  version of stage.sh's gate. Those names now live only in the untracked publish/private-patterns.local.
- To update: rebuild (`./reproduce.sh report publish`, or `python3 audit/report/build.py --single && audit/publish/stage.sh`),
  commit, push. Pages redeploys automatically.
