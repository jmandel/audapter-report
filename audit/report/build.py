#!/usr/bin/env python3
"""Render the audit report from findings.yaml + harness exports.

  python3 build.py            # render prototype/index.html from existing exports
  python3 build.py --export   # first re-run the harness export scripts (docker), then render
  python3 build.py --single   # also write prototype/index.single.html with audio inlined as data URIs

Inputs:  findings.yaml, ../FINDINGS-LOG.md (id check), ../harness/logs-summary.txt (test results),
         ../harness/oct/out/report/<asset_dir>/<build>/{*.wav,data.json}, pinned git SHAs (code excerpts).
Outputs: prototype/index.html, prototype/assets/<asset_dir>/..., prototype/build-manifest.json
"""
import base64, html, json, math, os, re, shutil, subprocess, sys
import yaml
import importlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sketchlib import rows2
import settings_panel

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIT = os.path.dirname(HERE)
ROOT = os.path.dirname(AUDIT)       # repo root; every path below is relative to it
HARNESS = os.path.join(AUDIT, "harness")
EXPORTS = os.path.join(HARNESS, "oct", "out", "report")
OUT = os.path.join(HERE, "prototype")
E = html.escape
AUDIT_URL = ""   # set from findings.yaml report.repo_url + "/audit"


# ----------------------------------------------------------------------------------------------- checks
def fail(msg):
    sys.exit("build.py: " + msg)

def check_log_ids(ids):
    log = open(os.path.join(AUDIT, "FINDINGS-LOG.md")).read()
    for i in ids:
        if not re.search(r"\*\*[^*]*\b" + re.escape(i) + r"\b[^*]*\*\*", log):
            fail(f"finding id {i} not found in FINDINGS-LOG.md")

class Tests(dict):
    """logs-summary.txt results. Lookup by (script, test name); the name is matched as a prefix of the line because
    long names leave only one space before the detail column."""
    def __init__(self, path):
        super().__init__()
        self.lines = []
        for line in open(path):
            m = re.match(r"\[(\S+)\] (PASS|FAIL)\s+(.*)$", line.rstrip())
            if m:
                self.lines.append((m.group(1) + ".m", m.group(2), m.group(3)))
                n = re.split(r"\s{2,}", m.group(3), maxsplit=1)
                self[(m.group(1) + ".m", n[0].strip())] = (m.group(2), n[1].strip() if len(n) > 1 else "")
    def get(self, key, default=None):
        f, name = key
        for ff, st, rest in self.lines:
            if ff == f and rest.startswith(name):
                return (st, rest[len(name):].strip())
        return default

def test_results():
    return Tests(os.path.join(HARNESS, "logs-summary.txt"))

# ----------------------------------------------------------------------------------------------- code refs
def excerpt(repos, ref):
    r = repos[ref["repo"]]
    local = os.path.join(ROOT, r["local"])
    try:
        src = subprocess.run(["git", "-C", local, "show", f'{r["sha"]}:{ref["path"]}'],
                             capture_output=True, text=True, check=True).stdout.split("\n")
    except subprocess.CalledProcessError as e:
        fail(f"git show failed for {ref}: {e.stderr}")
    a, b = ref["lines"]
    lines = src[a - 1:b]
    if ref.get("expect") and not any(ref["expect"] in l for l in lines):
        fail(f'{ref["path"]}:{a}-{b} at {r["sha"][:7]} does not contain {ref["expect"]!r} (line drift?)')
    anchor = f"#L{a}" if a == b else f"#L{a}-L{b}"
    url = f'{r["url"]}/blob/{r["sha"]}/{ref["path"]}{anchor}'
    return lines, url

def dedent(lines):
    exp = [l.expandtabs(4) for l in lines]
    ind = min((len(l) - len(l.lstrip()) for l in exp if l.strip()), default=0)
    return [l[ind:] for l in exp]

# ----------------------------------------------------------------------------------------------- html
SEV = {"high": ("High", "sev-high"), "med": ("Medium", "sev-med"), "low": ("Low", "sev-low")}
# Where a behaviour comes from, kept low-key: a narrow "Since" column and one line at the end of each card's cause.
SINCE = {"upstream": "≤ 2.1.5", "blab": "blab fork", "blab-amplified": "≤ 2.1.5", "blab-intended": "blab fork", "both": "≤ 2.1.5"}
SINCE_LINE = {"upstream": "Present since at least Audapter 2.1.5.", "both": "Present since at least Audapter 2.1.5.",
              "blab-amplified": "Present since at least Audapter 2.1.5; made more likely in the blab-lab fork.",
              "blab": "Introduced in the blab-lab fork.", "blab-intended": "Introduced in the blab-lab fork."}
SEV_ORDER = {"high": 0, "med": 1, "low": 2}
KIND = {"H": "Harness", "D": "Driver", "R": "Reading", "F": "Formal"}
ROLE = {"input": "Input", "expected": "Expected", "observed": "Observed", "ab": "A/B"}

def code_block(repos, ref, compact=False):
    lines, url = excerpt(repos, ref)
    a, b = ref["lines"]; r = repos[ref["repo"]]
    loc = f'{ref["path"].split("/")[-1]}:{a}' + (f"–{b}" if b != a else "")
    who = {"blab-mex": "blab", "blab-matlab": "blab MATLAB", "upstream-mex": "upstream"}[ref["repo"]]
    if compact:
        return f'<a class="permalink" href="{url}">{E(who)} {E(loc)} @{r["sha"][:7]}</a>'
    hl = set(ref.get("hl", []))
    rows = "".join(f'<span class="ln{" hl" if a+i in hl else ""}"><span class="no" aria-hidden="true">{a+i}</span>{E(l) or " "}</span>'
                   for i, l in enumerate(dedent(lines)))
    return (f'<figure class="code"><figcaption><a class="permalink" href="{url}">{E(who)} · {E(ref["path"])} lines {a}'
            f'{"–"+str(b) if b != a else ""} @{r["sha"][:7]}</a></figcaption><pre><code>{rows}</code></pre>'
            f'<p class="code-note">{ref.get("note", "")}</p></figure>')

REQUIRED = ["headline", "what", "scope", "example", "table", "sketch", "verify", "reproduce"]

def load_real(card):
    r = card.get("real")
    if not r:
        return None, {}
    p = os.path.normpath(os.path.join(EXPORTS, r["dir"], "real", r.get("data", "data.json")))
    return r, json.load(open(p))

def clip_li(card, a, m, src_rel, sketch_id=None, credit=None, fmt=None):
    """One clip. Clips tied to an expected-vs-observed figure carry `panel` (exp/obs) and `trial`: the playhead is drawn on
    that trial of that panel, and the label names both ("Expected, trial 4")."""
    fmt = fmt or (lambda t: t)
    warn_t = a.get("warn") or m.get("warn")
    warn = f'<p class="warn"><span aria-hidden="true">!</span> {E(warn_t)}</p>' if warn_t else ""
    label = fmt(re.sub(r"^(Input|Output):\s*", "", a.get("label", m.get("label", ""))))
    title = a.get("title") or ROLE[a["role"]]
    dur = f' <span class="dur">{m["dur_s"]:.1f} s</span>' if m.get("dur_s") else ""
    ds = ""
    if sketch_id and a.get("panel"):
        ds = f' data-sketch="{sketch_id}-{a["panel"]}" data-trial="{a.get("trial", "")}" data-offset="{a.get("offset", 0)}"'
    elif sketch_id and not a.get("no_playhead"):
        ds = f' data-sketch="{sketch_id}" data-offset="{a.get("offset", 0)}"'
    cr = f'<p class="credit">{credit}</p>' if credit else ""
    return (f'<li class="clip role-{a["role"]}"><span class="swatch" aria-hidden="true"></span><div>'
            f'<p class="clip-l" data-file="{E(a["file"])}"><strong>{E(title)}.</strong> {E(label)}{dur}</p>'
            f'<audio controls preload="none" src="{src_rel}/{a["file"]}"{ds}></audio>{warn}{cr}</div></li>')


def meas_clips(card, exp_dir, dst):
    """Published clips cut from the export's meas/ WAVs (audio items with `src`), with ONE shared gain for the card,
    as harness/oct/report_wavgroup.m does: loudest clip's active RMS to -20 dBFS, capped so no clip peaks above -1 dBFS.
    src: a file under <export>/ or a list of files joined with `gap_s` of silence (A/B clips); a, b: excerpt in seconds."""
    import numpy as np, wave
    import measure as MS
    items = [a for a in card.get("audio", []) if a.get("src")]
    if not items:
        return []
    sigs = []
    for a in items:
        srcs = a["src"] if isinstance(a["src"], list) else [a["src"]]
        parts = []
        for i, f in enumerate(srcs):
            fs, x = MS.load(os.path.join(exp_dir, f))
            lo, hi = a.get("a", 0), a.get("b")
            x = x[int(round(lo * fs)): (int(round(hi * fs)) if hi else len(x))]
            if i: parts.append(np.zeros(int(round(a.get("gap_s", 0.5) * fs))))
            parts.append(x)
        sigs.append((fs, np.concatenate(parts)))
    def act(x, fs):
        w = int(0.02 * fs); n = len(x) // w
        b = np.sqrt((x[:n * w].reshape(n, w) ** 2).mean(1)); a_ = x[:n * w].reshape(n, w)[b > 1e-3]
        return float(np.sqrt((a_ ** 2).mean())) if a_.size else 0.0
    g = 10 ** (-20 / 20) / max(act(x, fs) for fs, x in sigs)
    g = min(g, 10 ** (-1 / 20) / max(float(np.abs(x).max()) for fs, x in sigs))
    man = []
    for a, (fs, x) in zip(items, sigs):
        y = np.clip(np.round(g * x * 32767), -32768, 32767).astype("<i2")
        with wave.open(os.path.join(dst, a["file"]), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(fs); w.writeframes(y.tobytes())
        man.append({"file": a["file"], "label": a.get("label", ""), "dur_s": len(x) / fs, "gain_db": 20 * math.log10(g), "warn": a.get("warn", "")})
    return man

def card_html(repos, card, tests, data, up, asset_rel, variants):
    missing = [k for k in REQUIRED if not card.get(k)] + [f"cause.{k}" for k in ("summary", "refs", "fix") if not card.get("cause", {}).get(k)]
    if missing:
        fail(f'card {card["id"]}: missing sections {missing} (template: what, scope, example, table, cause, fix, verify)')
    if data.get("no_event"):   # e.g. a live run that produced no burst: say so instead of drawing a figure
        sev, sevc = SEV[card["severity"]]
        return (f'<article class="card" id="{anchor(card["id"])}"><aside class="rail"><p class="fid">{E(card["id"])}</p>'
                f'<p class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev} severity</p></aside><div class="main">'
                f'<h3>{E(card["headline"])}</h3><p>{E(data["no_event"])}</p><p>{card["cause"]["summary"]}</p>'
                f'<p class="repro"><span>Reproduce</span> <code>{E(card["reproduce"])}</code></p></div></article>')
    mod = importlib.import_module("sketches." + card["sketch"])
    v = dict(data)
    if hasattr(mod, "derive"):
        v.update(mod.derive(data, up))
    r, rd = load_real(card)
    if r:
        rv = dict(rd)
        if hasattr(mod, "derive_real"):
            rv.update(mod.derive_real(rd))
        v.update({"r_" + k: x for k, x in rv.items()})
    fmt = lambda t: t.format(**v)
    pre = re.sub(r"[^A-Za-z0-9]", "", card["id"]) + "_"     # card values for section prose, e.g. [[I01_n_gaps]]
    SECVALS.update({pre + k: x for k, x in v.items() if isinstance(x, (int, float, str)) and not k.startswith("_")})
    sev, sevc = SEV[card["severity"]]
    rows = "".join(f'<tr><td class="grp">{E(g)}</td><th scope="row">{E(fmt(c))}</th><td>{E(fmt(x))}</td></tr>' for g, c, x in card["table"])
    badges = "".join(f'<li class="vk vk-{k}"><span class="vk-l">{k}</span> {KIND[k]}</li>' for k in card["status"])
    sid = "sk-" + anchor(card["id"]).lower()
    clips = []
    mc = {m["file"]: m for m in meas_clips(card, data["_dir"], os.path.join(OUT, asset_rel))}
    for a in card.get("audio", []):
        m = mc.get(a["file"]) or next(x for x in data["audio"] if x["file"] == a["file"])
        clips.append(clip_li(card, a, m, asset_rel, sid, fmt=fmt))
    rclips = []
    if r:
        dst = os.path.join(OUT, "assets", card["asset_dir"], "real"); os.makedirs(dst, exist_ok=True)
        src = os.path.join(EXPORTS, r["dir"], "real")
        for c in r.get("clips", []):
            shutil.copy2(os.path.join(src, c["file"]), dst)
            m = next((x for x in rd.get("audio", []) if isinstance(rd.get("audio"), list) and x["file"] == c["file"]), {})
            rclips.append(clip_li(card, c, m, f"assets/{card['asset_dir']}/real", None, clip_credit(c["sources"])))
    listen = ""
    if clips or rclips:
        listen = '<section class="listen" aria-label="Audio"><h4>Listen</h4>'
        if clips:
            listen += (f'<ul class="clips">{"".join(clips)}</ul><p class="norm">{card.get("audio_note", "These clips share one playback gain, so level differences you hear are real. 16 kHz, 16-bit, as recorded by Audapter.")}</p>')
        if rclips:
            listen += (f'<h5>Real speech</h5><ul class="clips">{"".join(rclips)}</ul>'
                       f'<p class="norm">{E(r.get("audio_note", "These clips share one playback gain. Real recordings from the audit\u2019s open corpus; credits at the end of the report."))}</p>')
        listen += '</section>'
    elif card.get("audio_note"):
        listen = f'<p class="norm">{card["audio_note"]}</p>'
    refs = "".join(code_block(repos, x) for x in card["cause"]["refs"])
    ver = []
    for x in card["verify"]:
        res = ""
        if x.get("test"):
            st, det = tests.get((x["name"], x["test"]), ("?", "not in logs-summary.txt"))
            res = f' <span class="res res-{st.lower()}">{st}</span> <span class="res-d">“{E(x["test"])}”: {E(det)}</span>'
        elif x.get("detail"):
            res = f' <span class="res-d">{E(x["detail"])}</span>'
        ver.append(f'<li><span class="vk-l">{x["kind"]}</span> {E(x["what"])}: {file_link(x["name"])}{res}</li>')
    wide = mod.sketch(data, up)
    narrow = narrow_sketch(card, data, up)
    cap = f'<p class="figcap">{fmt(card["figure_caption"])}</p>' if card.get("figure_caption") else ""
    setp = ""
    if data.get("settings") or card.get("settings"):
        S = dict(data.get("settings") or {}); S.update(card.get("settings", {}).get("override", {}))
        setp = settings_panel.panel_html(card, S, asset_rel)
        json.dump(settings_panel.settings_json(card, S), open(os.path.join(OUT, asset_rel, "settings.json"), "w"), indent=1)
    reach = f'<p class="reach reach-{card.get("reach_kind", "none")}">{fmt(card["reach"])}</p>' if card.get("reach") else ""
    return f'''
<article class="card" id="{anchor(card["id"])}" aria-labelledby="{anchor(card["id"])}-h">
  <aside class="rail">
    <p class="fid">{E(card["id"])}</p>
    <p class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev} severity</p>
    <ul class="vks" aria-label="Verification">{badges}</ul>
    <p class="railnote"><a href="{notes_url(card["notes"])}">Audit notes</a><br><a href="{AUDIT_URL}/FINDINGS-LOG.md">Findings log</a></p>
  </aside>
  <div class="main">
    <h3 id="{anchor(card["id"])}-h">{E(card["headline"])}</h3>
    {reach}
    <h4>What happens</h4>
    <p>{fmt(card["what"])}</p>
    <h4>When it matters</h4>
    <p>{fmt(card["scope"])}</p>
    <h4>Example</h4>
    <p>{fmt(card["example"])}</p>
    {setp}
    <figure class="fig">{cap}<div class="sk-wide-wrap">{wide}</div><div class="sk-narrow-wrap">{narrow}</div></figure>
    {listen}
    {interactive_html(card, variants)}
    <h4>How big, how often</h4>
    <table class="plain howbig"><tbody>{rows}</tbody></table>
    <p class="norm">Data: <a href="{asset_rel}/data.json">data.json</a> from the export script.</p>
    <section class="cause" aria-label="Cause">
      <h4>Cause</h4>
      <p>{card["cause"]["summary"]}</p>
      {refs}
      <p class="since">{card.get("since", SINCE_LINE[card["origin"]])}</p>
    </section>
    <section class="fix-sec" aria-label="Fix">
      <h4>{E(card["cause"].get("fix_label", "Safe pattern and fix"))}</h4>
      <p>{card["cause"]["fix"]}</p>
    </section>
    <section class="verify" aria-label="Verification">
      <h4>How we know</h4>
      <ul>{"".join(ver)}</ul>
      <p class="repro"><span>Reproduce</span> <code>{E(card["reproduce"])}</code></p>
    </section>
  </div>
</article>'''

def narrow_sketch(card, data, up):
    """Render the card's sketch again in the narrow (phone) layout."""
    import sketchlib
    os.environ["SKETCH_LAYOUT"] = "narrow"
    try:
        importlib.reload(sketchlib)
        mod = importlib.reload(importlib.import_module("sketches." + card["sketch"]))
        return mod.sketch(json.loads(json.dumps(data)), json.loads(json.dumps(up)) if up else up)
    finally:
        os.environ["SKETCH_LAYOUT"] = "wide"
        importlib.reload(sketchlib)
        importlib.reload(importlib.import_module("sketches." + card["sketch"]))

def notes_check(ref):
    fn, _, anchor = ref.partition("#")
    p = os.path.join(AUDIT, fn)
    if not os.path.exists(p):
        fail(f"notes file {fn} missing")
    if anchor:
        heads = [re.sub(r"[^a-z0-9]+", "", h.split(".")[0].lower()) for h in re.findall(r"^### (.+)$", open(p).read(), re.M)]
        if re.sub(r"[^a-z0-9]+", "", anchor.lower()) not in heads and f'name="{anchor}"' not in open(p).read():
            fail(f"notes heading {ref} not found")

_MANIFEST = None
def manifest():
    global _MANIFEST
    if _MANIFEST is None:
        import csv
        _MANIFEST = {r["id"]: r for r in csv.DictReader(open(os.path.join(AUDIT, "corpus", "manifest.csv")))}
    return _MANIFEST

def clip_credit(ids):
    """Source and licence line for published real clips; refuses restricted or unclear-provenance sources."""
    groups, cmu = {}, False
    for i in ids:
        m = manifest().get(i)
        if m is None:
            fail(f"real clip {i} not in corpus/manifest.csv")
        if i.startswith(("praat_", "hillenbrand")) or "GPL" in m["license"]:
            fail(f"real clip {i}: source not approved for report audio ({m['license']})")
        cmu = cmu or "CMU" in m["license"]
        groups.setdefault((m["source"].split(",")[0], m["license"].split(" (")[0]), []).append(m["orig_file"].split("/")[-1])
    note = "; ".join(f'{E(s)}: {", ".join(E(f) for f in fs)} ({E(l)})' for (s, l), fs in groups.items())
    note = "Source: " + note + ". Cut, mono 48 kHz, processed by Audapter (modified)."
    if cmu:
        note += ' CMU ARCTIC © 2003 Carnegie Mellon University (<a href="assets/licenses/CMU_ARCTIC_COPYING.txt">licence notice</a>).'
    return note

def real_html(card, variants_unused=None):
    r = card.get("real")
    if not r:
        return ""
    src = os.path.join(EXPORTS, r["dir"], "real")
    rd = json.load(open(os.path.normpath(os.path.join(EXPORTS, r["dir"], "real", r.get("data", "data.json")))) if not r.get("data", "").startswith("../")
                   else open(os.path.join(EXPORTS, r["dir"], r["data"][3:])))
    mod = importlib.import_module("sketches." + card["sketch"])
    v = dict(rd)
    if hasattr(mod, "derive_real"):
        v.update(mod.derive_real(rd))
    dst = os.path.join(OUT, "assets", card["asset_dir"], "real"); os.makedirs(dst, exist_ok=True)
    clips = []
    for c in r.get("clips", []):
        shutil.copy2(os.path.join(src, c["file"]), dst)
        warn = f'<p class="warn"><span aria-hidden="true">!</span> {E(c["warn"])}</p>' if c.get("warn") else ""
        clips.append(f'<li class="clip role-{c["role"]}"><span class="swatch" aria-hidden="true"></span><div>'
                     f'<p class="clip-l" data-file="real/{c["file"]}"><strong>{ROLE[c["role"]]}.</strong> {E(c["label"])}</p>'
                     f'<audio controls preload="none" src="assets/{card["asset_dir"]}/real/{c["file"]}"></audio>{warn}'
                     f'<p class="credit">{clip_credit(c["sources"])}</p></div></li>')
    nums = "".join(f"<tr><th scope=row>{E(k)}</th><td>{E(t.format(**v))}</td></tr>" for k, t in r.get("numbers", []))
    fig = ""
    if hasattr(mod, "sketch_real"):
        fig = f'<figure class="fig">{mod.sketch_real(rd)}</figure>'
    return f'''<section class="real" aria-label="Real speech">
      <h4>On real speech</h4>
      <p>{r["text"].format(**v)}</p>
      {fig}
      {"<table class='plain realnums'>" + nums + "</table>" if nums else ""}
      {"<ul class='clips'>" + "".join(clips) + "</ul><p class='norm'>" + E(r.get("audio_note", "The clips in this section share one playback gain. Real recordings from the audit's open corpus (audit/corpus); full credits at the end of the report.")) + "</p>" if clips else ""}
    </section>'''

def notes_url(ref):
    """GitHub URL for a notes reference 'notes/x.md#f1', with the anchor GitHub generates for that heading."""
    fn, _, anchor = ref.partition("#")
    url = f"{AUDIT_URL}/{fn}"
    if anchor:
        for h in re.findall(r"^### (.+)$", open(os.path.join(AUDIT, fn)).read(), re.M):
            if re.sub(r"[^a-z0-9]+", "", h.split(".")[0].lower()) == re.sub(r"[^a-z0-9]+", "", anchor.lower()):
                gh = re.sub(r"[^\w\- ]", "", h.strip().lower()).replace(" ", "-")
                return f"{url}#{gh}"
    return url

def file_link(name):
    """Link a script name (first word) to the public repo if it is an audit file; else plain code."""
    first, _, rest = name.partition(" ")
    for cand in (f"harness/oct/{first}", first, f"report/{first}"):
        if os.path.isfile(os.path.join(AUDIT, cand)):
            return f'<a href="{AUDIT_URL}/{cand}"><code>{E(first)}</code></a>' + (f" <code>{E(rest)}</code>" if rest else "")
    return f"<code>{E(name)}</code>"

def anchor(i):
    """HTML id for a full card: 'OST-F1' stays as is; 'LIVE-1 / LIVE-2' becomes 'LIVE-1--LIVE-2'."""
    return re.sub(r"\s*/\s*", "--", i.strip())

def slug(i):
    return re.sub(r"[^a-z0-9]+", "-", i.lower()).strip("-")

FIDELITY = (" Live-path simulation: the real audioIO/RtAudio ASIO code built with GCC on Linux and driven by a fake ASIO driver;"
            " rates are indicative, not Windows-exact.")

def short_html(repos, items):
    out = []
    for r in sorted(items, key=lambda r: SEV_ORDER[r["sev"]]):
        notes_check(r["notes"])
        sev, sevc = SEV[r["sev"]]
        refs = "".join(code_block(repos, x) for x in r["refs"])
        miss = [k for k in ("title", "what", "scope", "fix", "verify", "refs") if not r.get(k)]
        if miss:
            fail(f'short card {r["id"]}: missing {miss}')
        out.append(f'''<article class="short" id="{slug(r["id"])}" aria-labelledby="{slug(r["id"])}-h">
  <p class="short-meta"><span class="fid">{E(r["id"])}</span> <span class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev}</span>
    <span class="vk-l">{r["status"]}</span></p>
  <h3 id="{slug(r["id"])}-h">{E(r["title"])}</h3>
  <p><strong>What happens.</strong> {r["what"]}</p>
  <p><strong>When it matters.</strong> {r["scope"]}</p>
  {refs}
  <p class="since">{r.get("since", SINCE_LINE[r["origin"]])}</p>
  <p><strong>Fix.</strong> {r["fix"]}</p>
  <p class="short-v"><strong>How we know.</strong> {E(r["verify"])}{FIDELITY if r["id"].startswith("LIVE") else ""} <a href="{notes_url(r["notes"])}">Audit notes</a></p>
</article>''')
    return "".join(out)

def compact_html(repos, rows):
    out = []
    for r in sorted(rows, key=lambda r: SEV_ORDER[r["sev"]]):
        notes_check(r["notes"])
        sev, sevc = SEV[r["sev"]]
        rp = repos[r.get("repo", "blab-mex")]
        path, _, ln = r["loc"].partition(":")
        a, _, b = ln.partition("-")
        url = f'{rp["url"]}/blob/{rp["sha"]}/{path}#L{a}' + (f"-L{b}" if b else "")
        out.append(f'<tr id="{slug(r["id"])}"><td class="t-id">{E(r["id"])}</td><td><span class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev}</span></td>'
                   f'<td>{E(r["text"])}</td><td><span class="vk-l">{r["status"]}</span></td>'
                   f'<td><a class="permalink" href="{url}">{E(path.split("/")[-1])}:{E(ln)}</a></td><td class="t-since">{SINCE[r["origin"]]}</td></tr>')
    return "".join(out)

def table_html(rows, short=(), sections=()):
    """Findings at a glance, grouped by report section (full cards first, then short cards, each by severity)."""
    byid = {r["id"]: r for r in rows}; sh = {r["id"]: r for r in short}
    def row(r, href, text):
        sev, sevc = SEV[r["sev"]]
        return (f'<tr><td class="t-id"><a href="#{href}">{E(r["id"])}</a></td><td><span class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev}</span></td>'
                f'<td>{E(text)}</td><td><span class="vk-l">{r["status"]}</span></td><td class="t-since">{SINCE[r["origin"]]}</td></tr>')
    out = []
    for sec in sections:
        items = [byid[i] for i in sec.get("cards", []) if i in byid]
        shs = [sh[i] for i in sec.get("short", []) if i in sh]
        if not items and not shs and not sec.get("table_rows"):
            continue
        out.append(f'<tr class="group"><td colspan="5"><a href="#{sec["id"]}">{E(sec["title"])}</a></td></tr>')
        for r in sorted(items, key=lambda r: SEV_ORDER[r["sev"]]):
            out.append(row(r, anchor(r["id"]), r["text"]))
        for r in sec.get("table_rows", []):
            out.append(row(r, r.get("href", sec["id"]), r["text"]))
        for r in sorted(shs, key=lambda r: SEV_ORDER[r["sev"]]):
            out.append(row(r, slug(r["id"]), r["title"]))
    return "".join(out)

SECVALS = {}
def section_text(t):
    """Section prose with [[name]] or [[name:fmt]] values filled from harness logs (parse_section_values).
    'file:<name>' reads templates/<name>."""
    if t.startswith("file:"):
        t = open(os.path.join(HERE, "templates", t[5:].strip())).read()
    def rep(m):
        k, _, f = m.group(1).partition(":")
        if k not in SECVALS:
            fail(f"section value [[{k}]] not found in the parsed logs")
        v = SECVALS[k]
        return format(v, f) if f else str(v)
    return re.sub(r"\[\[([A-Za-z0-9_]+(?::[^\]]+)?)\]\]", rep, t)

def parse_section_values():
    """Numbers quoted in section prose, read from the harness logs that produced them (no hand-typed numbers)."""
    v = {}
    lab = os.path.join(EXPORTS, "labscripts", "exp_vsa_field.log")
    if os.path.exists(lab):
        txt = open(lab).read()
        blocks = re.split(r"\n=== ", txt)
        for b in blocks[1:]:
            name = b.split(" ", 1)[0]
            for m in re.finditer(r"scale (\d\.\d)\s+(\w+): produced F1/F2\s+(\d+)/\s*(\d+) Hz \| heard shift\s+([+-][\d.]+)/\s*([+-][\d.]+) mel \(intended\s+([+-][\d.]+)/\s*([+-][\d.]+)\) \| toward centre ([+-]?[\d.]+) \(intended ([\d.]+)\), off-axis\s+([\d.]+) mel", b):
                sc, vw = m.group(1).replace(".", ""), m.group(2)
                key = f"{name}_{vw}_{sc}"
                v[key + "_d1"], v[key + "_d2"] = float(m.group(5)), float(m.group(6))
                v[key + "_i1"], v[key + "_i2"] = float(m.group(7)), float(m.group(8))
                v[key + "_tc"], v[key + "_off"] = float(m.group(9)), float(m.group(11))
        m = re.search(r"output RMS ([\d.]+); with fb4GainDB=20log10\(0.98\) -> ([\d.]+); difference \+([\d.]+) dB", txt)
        if m:
            v["fb4_rms_set"], v["fb4_rms_db"], v["fb4_diff_db"] = float(m.group(1)), float(m.group(2)), float(m.group(3))
        for name in ("vsaCentralize", "vsaGeneralize", "vsaSentence"):
            tcs = [v[k] for k in v if k.startswith(name + "_") and k.endswith("_05_tc")]
            if tcs:
                v[name + "_wrongdir"] = sum(1 for x in tcs if x < 0); v[name + "_n"] = len(tcs)
                v[name + "_tc_min"], v[name + "_tc_max"] = min(tcs), max(tcs)
                v[name + "_tc_away"] = -min(tcs)
            offs = [v[k] for k in v if k.startswith(name + "_") and k.endswith("_05_off")]
            if offs: v[name + "_off_min"], v[name + "_off_max"] = min(offs), max(offs)
            g0 = [math.hypot(v[k[:-3] + "_d1"], v[k[:-3] + "_d2"]) for k in v if k.startswith(name + "_") and k.endswith("_00_tc")]
            if g0: v[name + "_s0_min"], v[name + "_s0_max"] = min(g0), max(g0)
    mix = os.path.join(EXPORTS, "carryover", "exp_mixed.log")
    if os.path.exists(mix):
        txt = open(mix).read()
        s1 = re.findall(r"fb3 trial \d+ \((\w+), [^)]*\): shifted ([\d.]+) s, logged dF1 ([+-][\d.]+) mel, output/input F1 ([\d.]+) \| fwd==rev logged: (\d)", txt)
        catch = [x for x in s1 if x[0] == "noShift"]
        v["s1_n"], v["s1_catch_n"] = len(s1), len(catch)
        v["s1_catch_shift_max"] = max(float(x[1]) for x in catch) if catch else float("nan")
        v["s1_catch_ratio_min"] = min(float(x[3]) for x in catch) if catch else float("nan")
        v["s1_catch_ratio_max"] = max(float(x[3]) for x in catch) if catch else float("nan")
        v["s1_pert_mel"] = max(abs(float(x[2])) for x in s1 if x[0] != "noShift")
        v["s1_same"] = sum(int(x[4]) for x in s1[1:])
        v["s1_same_n"] = len(s1) - 1
        fb1 = re.findall(r"fb1 trial \d+: fwd==rev signalOut bit-identical: (\d)", txt)
        v["s1_fb1_same"], v["s1_fb1_n"] = sum(int(x) for x in fb1), len(fb1)
        s2 = re.findall(r"trial \d+ \((shift|level/catch)\): .*?\| shifted ([\d.]+) s .*?fwd==rev logged: (\d)", txt)
        v["s2_n"] = len(s2); v["s2_catch_n"] = sum(1 for x in s2 if x[0] != "shift")
        v["s2_catch_shift_max"] = max((float(x[1]) for x in s2 if x[0] != "shift"), default=float("nan"))
        v["s2_same"] = sum(int(x[2]) for x in s2[1:]); v["s2_same_n"] = len(s2) - 1
    return v

def fonts_css():
    """Charis SIL (OFL, a Charter derivative), Latin subset, inlined so the report renders the same offline."""
    out = []
    for w in (400, 700):
        for st in ("normal", "italic"):
            p = os.path.join(HERE, "templates", "fonts", f"charis-{w}-{st}.woff2")
            b = base64.b64encode(open(p, "rb").read()).decode()
            out.append(f'@font-face{{font-family:"Charis SIL";font-weight:{w};font-style:{st};font-display:swap;'
                       f'src:url(data:font/woff2;base64,{b}) format("woff2");}}')
    return "\n".join(out) + "\n"

def load_variants():
    wd = os.path.join(OUT, "wasm")
    info = {}
    if os.path.isdir(wd):
        for f in os.listdir(wd):
            if f.endswith(".build.json"):
                j = json.load(open(os.path.join(wd, f))); info[j["variant"]] = j
    return info

def check_panel(card, variants):
    """Refuse a panel whose WASM variant cannot show its finding (PLAN.md section 6)."""
    w = card["interactive"]; needs = w.get("needs", {})
    for v in w["variants"]:
        if v not in variants:
            fail(f'{card["id"]}: WASM variant {v} not built (run report/wasm/build-variants.sh {v})')
        j = variants[v]
        if needs.get("shipped_playback") and j["maxPBSize"] != 480000:
            fail(f'{card["id"]}: variant {v} has maxPBSize {j["maxPBSize"]}, panel needs the shipped 480000')
        if needs.get("recorder_s") and j["maxRecSize"] / 16000 < needs["recorder_s"]:
            fail(f'{card["id"]}: variant {v} records {j["maxRecSize"]/16000:g} s, panel needs {needs["recorder_s"]} s')
        if needs.get("shipped_sizes") and j["sizes"] != "full":
            fail(f'{card["id"]}: variant {v} is "{j["sizes"]}", panel needs shipped buffer sizes')
        want = [p for p in (w.get("patches", {}).get(v, []))]
        have = [p["file"] for p in j["patches"]]
        if want and want != have:
            fail(f'{card["id"]}: variant {v} carries {have}, panel expects {want}')

def write_panel_data(card):
    w = card["interactive"]; src = os.path.join(EXPORTS, card["asset_dir"], "blab")
    d = {"params": w.get("params", {}),
         "inputs": {k: base64.b64encode(open(os.path.join(src, f), "rb").read()).decode() for k, f in w.get("inputs", {}).items()}}
    os.makedirs(os.path.join(OUT, "assets", card["asset_dir"]), exist_ok=True)
    open(os.path.join(OUT, "assets", card["asset_dir"], "widget-data.js"), "w").write(
        "window.AUDAPTER_WIDGETS = window.AUDAPTER_WIDGETS || {};\nwindow.AUDAPTER_WIDGETS[" + json.dumps(w["id"]) + "] = " + json.dumps(d) + ";\n")

def patch_lines(fn):
    out = []
    for l in open(os.path.join(HERE, "patches", fn)).read().splitlines():
        if l.startswith(("+++", "---")):
            if l.startswith("+++"): out.append(("f", l[4:].split()[0].split("/", 1)[-1]))
        elif l.startswith("+") or l.startswith("-"):
            out.append((l[0], l[1:].expandtabs(4).strip()))
    return out

FIRST_PANEL_NOTE = ['<p class="inote">Each run loads the Audapter core in this page, about 150–300 MB of memory per build. On a phone, run one panel at a time. '
                    'Try your own recordings and settings in the <a href="playground/">Playground</a>.</p>']

def interactive_html(card, variants):
    w = card.get("interactive")
    if not w:
        return ""
    if w.get("status") == "planned":
        return (f'<section class="interactive planned" aria-label="Interactive panel (planned)"><h4>Run it in your browser</h4>'
                f'<p>Planned: {w["plan"]}</p></section>')
    check_panel(card, variants)
    write_panel_data(card)
    diffs = []
    for v in w["variants"]:
        for p in variants[v]["patches"]:
            rows = "".join(f'<span class="pl pl-{k}">{E(t)}</span>' if k in "+-" else f'<span class="pl pl-f">{E(t)}</span>' for k, t in patch_lines(p["file"]))
            label = w.get("variant_labels", {}).get(v, v)
            diffs.append(f'<details class="ipatch"><summary>The change in the “{E(label)}” build: <code>report/patches/{E(p["file"])}</code></summary><pre class="ipatch-code"><code>{rows}</code></pre></details>')
    return f'''<section class="interactive" data-widget="{w["id"]}" data-variants="{" ".join(w["variants"])}" aria-label="Interactive panel">
      <h4>Run it in your browser</h4>
      <p>{w["text"]}</p>
      {"".join(diffs)}
      {FIRST_PANEL_NOTE.pop() if FIRST_PANEL_NOTE else ""}
      <p><button type="button" class="run">{E(w.get("button", "Run on both builds"))}</button> <span class="istatus" role="status"></span></p>
      <div class="iresult"></div>
    </section>'''

def diff_html(tests):
    rows = []
    for (f, name), (st, det) in tests.items():
        if f == "t_diff.m":
            sc = name.split(": ", 1)[-1]
            rows.append(f'<tr><td><code>{E(sc)}</code></td><td><span class="res res-{st.lower()}">{st}</span></td><td>{E(det) or "bit-identical output and logged data"}</td></tr>')
    return "".join(rows)

def main():
    args = set(sys.argv[1:])
    if "--export" in args:
        subprocess.run([os.path.join(HERE, "export-all.sh")], check=True)
    y = yaml.safe_load(open(os.path.join(HERE, "findings.yaml")))
    global AUDIT_URL
    AUDIT_URL = y["report"]["repo_url"] + "/audit"
    y["cards"] = [c for sec in y["sections"] for c in sec.get("cards", [])]
    allc = {}
    for f in sorted(os.listdir(os.path.join(HERE, "cards"))):
        if f.endswith(".yaml"):
            c = yaml.safe_load(open(os.path.join(HERE, "cards", f)))
            allc[c["id"]] = c
    missing = [cid for cid in y["cards"] if cid not in allc]
    if missing:
        print("note: cards listed but not written yet:", ", ".join(missing))
    extra = [cid for cid in allc if cid not in y["cards"]]
    if extra:
        print("note: cards not in findings.yaml order, appended:", ", ".join(extra))
    y["cards"] = [allc[cid] for cid in y["cards"] + extra if cid in allc]
    for extra_short in ("short-live.yaml",):
        p = os.path.join(HERE, extra_short)
        if os.path.exists(p):
            y["short"] = y.get("short", []) + (yaml.safe_load(open(p)) or [])
    for r in y["table"]:
        r["card"] = any(c["id"] == r["id"] for c in y["cards"])
    repos = y["repos"]
    check_log_ids([c["log"] for c in y["cards"]] + [p for r in y["table"] for p in r["id"].split(" / ")])
    tests = test_results()
    SECVALS.update(parse_section_values())
    variants = load_variants()
    os.makedirs(OUT, exist_ok=True)
    cards, manifest = {}, {"cards": {}}
    only = os.environ.get("CARDS")   # e.g. CARDS=OST-F2,OST-F8 python3 build.py : render only these (for quick iteration)
    for c in y["cards"]:
        if only and c["id"] not in only.split(","):
            continue
        src = os.path.join(EXPORTS, c["asset_dir"], "blab")
        if not os.path.exists(os.path.join(src, "data.json")):
            fail(f"missing export for {c['id']}: run build.py --export")
        dst = os.path.join(OUT, "assets", c["asset_dir"])
        shutil.rmtree(dst, ignore_errors=True); os.makedirs(dst, exist_ok=True)   # no stale files from earlier builds
        for f in os.listdir(src):
            if os.path.isfile(os.path.join(src, f)):
                shutil.copy2(os.path.join(src, f), dst)
        data = json.load(open(os.path.join(src, "data.json")))
        data["_dir"] = os.path.join(EXPORTS, c["asset_dir"])
        upf = os.path.join(EXPORTS, c["asset_dir"], "upstream", "data.json")
        up = json.load(open(upf)) if os.path.exists(upf) else None
        try:
            cards[c["id"]] = card_html(repos, c, tests, data, up, f"assets/{c['asset_dir']}", variants)
        except (KeyError, ValueError, IndexError) as e:
            fail(f"card {c['id']}: {type(e).__name__} {e}")
        manifest["cards"][c["id"]] = {"assets": sorted(os.listdir(dst)), "upstream_export": bool(up)}
    tpl = open(os.path.join(HERE, "templates", "page.html")).read()
    css = fonts_css() + open(os.path.join(HERE, "templates", "style.css")).read()
    pdir = os.path.join(HERE, "templates", "panels")
    js = "\n".join([open(os.path.join(HERE, "templates", "page.js")).read(), open(os.path.join(HERE, "templates", "widgets", "panel.js")).read()]
                   + [open(os.path.join(pdir, f)).read() for f in sorted(os.listdir(pdir)) if f.endswith(".js")] + ["AudPanels.wire();"])
    shas = {k: v["sha"][:7] for k, v in repos.items()}
    shorts = {r["id"]: r for r in y.get("short", [])}
    placed = set(); body = []
    for sec in y["sections"]:
        blocks = [f'<section id="{sec["id"]}" class="fsec"><h2>{E(sec["title"])}</h2>']
        if sec.get("lead"):
            blocks.append(f'<div class="prose sec-lead">{section_text(sec["lead"])}</div>')
        for cid in sec.get("cards", []):
            placed.add(cid)
            if cid in cards:
                blocks.append(cards[cid])
        sh = [shorts[i] for i in sec.get("short", []) if i in shorts]
        placed.update(r["id"] for r in sh)
        if sh:
            blocks.append(f'<div class="short-sec"><h3 class="short-h">{E(sec.get("short_title", "Shorter findings in this group"))}</h3>{short_html(repos, sh)}</div>')
        comp = [r for r in y.get("compact", []) if r.get("section", "pitfalls") == sec["id"]]
        if comp:
            blocks.append(f'<div class="other-sec"><h3 class="short-h">{E(sec.get("compact_title", "Further items (low severity or narrow conditions)"))}</h3><div class="tscroll"><table class="findings compact">'
                          '<thead><tr><th scope="col">ID</th><th scope="col">Severity</th><th scope="col">Finding</th><th scope="col">Verified</th><th scope="col">Where</th><th scope="col">Since</th></tr></thead>'
                          f'<tbody>{compact_html(repos, comp)}</tbody></table></div></div>')
        blocks.append('</section>')
        body.append("".join(blocks))
    unplaced = [c["id"] for c in y["cards"] if c["id"] not in placed] + [i for i in shorts if i not in placed]
    if unplaced:
        fail(f"cards or short cards not placed in any section: {unplaced}")
    page = (tpl.replace("{{CSS}}", css).replace("{{JS}}", js).replace("{{TITLE}}", E(y["report"]["title"]))
               .replace("{{DATE}}", y["report"]["date"]).replace("{{TABLE}}", table_html(y["table"], y.get("short", []), y["sections"]))
               .replace("{{SECTIONS}}", "\n".join(body)).replace("{{DIFF}}", diff_html(tests))
               .replace("{{INTRO_FOUND}}", section_text(y["intro_found"])))
    for k, s in shas.items():
        page = page.replace("{{SHA:" + k + "}}", s).replace("{{URL:" + k + "}}", f'{repos[k]["url"]}/tree/{repos[k]["sha"]}')
    page = re.sub(r"(?<=\d) %", "\u00a0%", page)
    open(os.path.join(OUT, "index.html"), "w").write(page)
    lic = os.path.join(OUT, "assets", "licenses"); os.makedirs(lic, exist_ok=True)
    shutil.copy2(os.path.join(AUDIT, "corpus", "licenses", "CMU_ARCTIC_COPYING.txt"), lic)
    single = os.path.join(OUT, "index.single.html")
    if "--single" not in args and os.path.exists(single):
        os.remove(single)   # never publish a stale single-file copy
    if "--single" in args:
        def inline(m):
            p = os.path.join(OUT, m.group(1))
            return 'src="data:audio/wav;base64,' + base64.b64encode(open(p, "rb").read()).decode() + '"'
        open(os.path.join(OUT, "index.single.html"), "w").write(re.sub(r'src="(assets/[^"]+\.wav)"', inline, page))
    manifest["values"] = {k: (round(x, 4) if isinstance(x, float) else x) for k, x in SECVALS.items() if isinstance(x, (int, float, str))}
    json.dump(manifest, open(os.path.join(OUT, "build-manifest.json"), "w"), indent=1)
    print("wrote", os.path.join(OUT, "index.html"))

if __name__ == "__main__":
    main()
