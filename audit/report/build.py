#!/usr/bin/env python3
"""Render the audit report from findings.yaml + harness exports.

  python3 build.py            # render prototype/index.html from existing exports
  python3 build.py --export   # first re-run the harness export scripts (docker), then render
  python3 build.py --single   # also write prototype/index.single.html with audio inlined as data URIs

Inputs:  findings.yaml, ../FINDINGS-LOG.md (id check), ../harness/logs-summary.txt (test results),
         ../harness/oct/out/report/<asset_dir>/<build>/{*.wav,data.json}, pinned git SHAs (code excerpts).
Outputs: prototype/index.html, prototype/assets/<asset_dir>/..., prototype/build-manifest.json
"""
import base64, html, json, os, re, shutil, subprocess, sys
import yaml
import importlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sketchlib import rows2

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
ORIGIN = {"upstream": "Inherited from upstream", "blab": "Blab-only", "blab-amplified": "Blab-amplified", "blab-intended": "Blab change (intended?)", "both": "Blab and upstream"}
KIND = {"H": "Harness", "D": "Driver", "R": "Reading", "F": "Formal"}
ROLE = {"input": "Input", "expected": "Expected", "observed": "Observed"}

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

def card_html(repos, card, tests, data, up, asset_rel, variants):
    mod = importlib.import_module("sketches." + card["sketch"])
    v = dict(data)
    if hasattr(mod, "derive"):
        v.update(mod.derive(data, up))
    sev, sevc = SEV[card["severity"]]
    eff = card["effect"]
    nums = "".join(f"<tr><th scope=row>{E(k)}</th><td>{E(val.format(**v))}</td></tr>" for k, val in eff["numbers"])
    badges = "".join(f'<li class="vk vk-{k}"><span class="vk-l">{k}</span> {KIND[k]}</li>' for k in card["status"])
    audio = []
    for a in card.get("audio", []):
        m = next(x for x in data["audio"] if x["file"] == a["file"])
        warn = f'<p class="warn"><span aria-hidden="true">!</span> {E(m["warn"])}</p>' if m.get("warn") else ""
        audio.append(f'<li class="clip role-{a["role"]}"><span class="swatch" aria-hidden="true"></span>'
                     f'<div><p class="clip-l" data-file="{a["file"]}"><strong>{ROLE[a["role"]]}.</strong> {E(re.sub(r"^(Input|Output):\s*", "", m["label"]))} <span class="dur">{m["dur_s"]:.1f} s</span></p>'
                     f'<audio controls preload="none" src="{asset_rel}/{a["file"]}" data-sketch="sk-{anchor(card["id"]).lower()}" data-offset="{a.get("offset", 0)}"></audio>{warn}</div></li>')
    if audio:
        listen = (f'<section class="listen" aria-label="Audio"><h4>Listen</h4><ul class="clips">{"".join(audio)}</ul>'
                  f'<p class="norm">{card.get("audio_note", "All clips in this card share one playback gain, so level differences you hear are real. 16 kHz, 16-bit, as recorded by Audapter (<code>signalIn</code>, <code>signalOut</code>).")}</p></section>')
    else:
        listen = f'<section class="listen" aria-label="Audio"><h4>Listen</h4><p class="norm">{card["audio_note"]}</p></section>'
    refs = "".join(code_block(repos, r) for r in card["cause"]["refs"])
    uprefs = ", ".join(code_block(repos, r, compact=True) for r in card["cause"].get("upstream_refs", []))
    ver = []
    for x in card["verify"]:
        res = ""
        if x.get("test"):
            st, det = tests.get((x["name"], x["test"]), ("?", "not in logs-summary.txt"))
            res = f' <span class="res res-{st.lower()}">{st}</span> <span class="res-d">“{E(x["test"])}”: {E(det)}</span>'
        elif x.get("detail"):
            res = f' <span class="res-d">{E(x["detail"])}</span>'
        cls = " pending" if x.get("pending") else ""
        ver.append(f'<li class="{cls.strip()}"><span class="vk-l">{x["kind"]}</span> {E(x["what"])}: {file_link(x["name"])}{res}</li>')
    sketch = mod.sketch(data, up)
    return f'''
<article class="card" id="{anchor(card["id"])}" aria-labelledby="{anchor(card["id"])}-h">
  <aside class="rail">
    <p class="fid">{E(card["id"])}</p>
    <p class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev} severity</p>
    <p class="origin">{ORIGIN[card["origin"]]}</p>
    <ul class="vks" aria-label="Verification">{badges}</ul>
    <p class="railnote"><a href="{notes_url(card["notes"])}">Audit notes</a><br><a href="{AUDIT_URL}/FINDINGS-LOG.md">Findings log</a></p>
  </aside>
  <div class="main">
    <h3 id="{anchor(card["id"])}-h">{E(card["headline"])}</h3>
    <p class="setup">{eff["setup"]}</p>
    <dl class="eo">
      <div class="eo-e"><dt>Expected</dt><dd>{E(eff["expected"].format(**v))}</dd></div>
      <div class="eo-o"><dt>Observed</dt><dd>{E(eff["observed"].format(**v))}</dd></div>
      <div class="eo-m"><dt>Why it matters</dt><dd>{eff["matters"]}</dd></div>
    </dl>
    <figure class="fig">{sketch}
      <details class="data"><summary>Numbers behind this figure</summary><table>{nums}</table>
      <p>Source: <a href="{asset_rel}/data.json">data.json</a>, written by the export script from the harness run.</p></details>
    </figure>
    {listen}
    {interactive_html(card, variants)}
    <section class="cause" aria-label="Cause">
      <h4>Cause</h4>
      <p>{card["cause"]["summary"]}</p>
      {refs}
      <p class="upstream">Upstream 2.1.5: {uprefs}.</p>
      <p class="origin-note"><strong>Origin.</strong> {E(card["origin_note"])}</p>
      <p class="fix"><strong>{E(card["cause"].get("fix_label", "Suggested fix"))}.</strong> {card["cause"]["fix"]}</p>
    </section>
    <section class="verify" aria-label="Verification">
      <h4>How we know</h4>
      <ul>{"".join(ver)}</ul>
      <p class="repro"><span>Reproduce</span> <code>{E(card["reproduce"])}</code></p>
    </section>
  </div>
</article>'''

def notes_check(ref):
    fn, _, anchor = ref.partition("#")
    p = os.path.join(AUDIT, fn)
    if not os.path.exists(p):
        fail(f"notes file {fn} missing")
    if anchor:
        heads = [re.sub(r"[^a-z0-9]+", "", h.split(".")[0].lower()) for h in re.findall(r"^### (.+)$", open(p).read(), re.M)]
        if re.sub(r"[^a-z0-9]+", "", anchor.lower()) not in heads and f'name="{anchor}"' not in open(p).read():
            fail(f"notes heading {ref} not found")

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
    for r in items:
        notes_check(r["notes"])
        sev, sevc = SEV[r["sev"]]
        refs = "".join(code_block(repos, x) for x in r["refs"])
        out.append(f'''<article class="short" id="{slug(r["id"])}" aria-labelledby="{slug(r["id"])}-h">
  <p class="short-meta"><span class="fid">{E(r["id"])}</span> <span class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev}</span>
    <span class="origin">{ORIGIN[r["origin"]]}</span> <span class="vk-l">{r["status"]}</span></p>
  <h3 id="{slug(r["id"])}-h">{E(r["title"])}</h3>
  <p>{r["text"]}</p>
  {refs}
  <p class="short-v"><strong>How we know.</strong> {E(r["verify"])}{FIDELITY if r["id"].startswith("LIVE") else ""} <a href="{notes_url(r["notes"])}">Audit notes</a></p>
</article>''')
    return "".join(out)

def compact_html(repos, rows):
    out = []
    for r in rows:
        notes_check(r["notes"])
        sev, sevc = SEV[r["sev"]]
        rp = repos[r.get("repo", "blab-mex")]
        path, _, ln = r["loc"].partition(":")
        a, _, b = ln.partition("-")
        url = f'{rp["url"]}/blob/{rp["sha"]}/{path}#L{a}' + (f"-L{b}" if b else "")
        out.append(f'<tr id="{slug(r["id"])}"><td class="t-id">{E(r["id"])}</td><td><span class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev}</span></td>'
                   f'<td>{E(r["text"])}</td><td>{ORIGIN[r["origin"]]}</td><td><span class="vk-l">{r["status"]}</span></td>'
                   f'<td><a class="permalink" href="{url}">{E(path.split("/")[-1])}:{E(ln)}</a></td></tr>')
    return "".join(out)

def table_html(rows, short=()):
    out = []
    for r in rows:
        sev, sevc = SEV[r["sev"]]
        idc = f'<a href="#{anchor(r["id"])}">{E(r["id"])}</a>' if r.get("card") else E(r["id"])
        out.append(f'<tr><td class="t-id">{idc}</td><td><span class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev}</span></td>'
                   f'<td>{E(r["text"])}</td><td>{ORIGIN[r["origin"]]}</td><td><span class="vk-l">{r["status"]}</span></td></tr>')
    if short:
        out.append('<tr class="group"><td colspan="5">Short cards</td></tr>')
        for r in short:
            sev, sevc = SEV[r["sev"]]
            out.append(f'<tr><td class="t-id"><a href="#{slug(r["id"])}">{E(r["id"])}</a></td><td><span class="sev {sevc}"><span class="glyph" aria-hidden="true"></span>{sev}</span></td>'
                       f'<td>{E(r["title"])}</td><td>{ORIGIN[r["origin"]]}</td><td><span class="vk-l">{r["status"]}</span></td></tr>')
    return "".join(out)

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

FIRST_PANEL_NOTE = ['<p class="inote">Each run loads the Audapter core in this page, about 150–300 MB of memory per build. On a phone, run one panel at a time.</p>']

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
    variants = load_variants()
    os.makedirs(OUT, exist_ok=True)
    cards, manifest = [], {"cards": {}}
    only = os.environ.get("CARDS")   # e.g. CARDS=OST-F2,OST-F8 python3 build.py : render only these (for quick iteration)
    for c in y["cards"]:
        if only and c["id"] not in only.split(","):
            continue
        src = os.path.join(EXPORTS, c["asset_dir"], "blab")
        if not os.path.exists(os.path.join(src, "data.json")):
            fail(f"missing export for {c['id']}: run build.py --export")
        dst = os.path.join(OUT, "assets", c["asset_dir"]); os.makedirs(dst, exist_ok=True)
        for f in os.listdir(src):
            shutil.copy2(os.path.join(src, f), dst)
        data = json.load(open(os.path.join(src, "data.json")))
        upf = os.path.join(EXPORTS, c["asset_dir"], "upstream", "data.json")
        up = json.load(open(upf)) if os.path.exists(upf) else None
        try:
            cards.append(card_html(repos, c, tests, data, up, f"assets/{c['asset_dir']}", variants))
        except (KeyError, ValueError, IndexError) as e:
            fail(f"card {c['id']}: {type(e).__name__} {e}")
        manifest["cards"][c["id"]] = {"assets": sorted(os.listdir(dst)), "upstream_export": bool(up)}
    tpl = open(os.path.join(HERE, "templates", "page.html")).read()
    css = fonts_css() + open(os.path.join(HERE, "templates", "style.css")).read()
    pdir = os.path.join(HERE, "templates", "panels")
    js = "\n".join([open(os.path.join(HERE, "templates", "page.js")).read(), open(os.path.join(HERE, "templates", "widgets", "panel.js")).read()]
                   + [open(os.path.join(pdir, f)).read() for f in sorted(os.listdir(pdir)) if f.endswith(".js")] + ["AudPanels.wire();"])
    shas = {k: v["sha"][:7] for k, v in repos.items()}
    page = (tpl.replace("{{CSS}}", css).replace("{{JS}}", js).replace("{{TITLE}}", E(y["report"]["title"]))
               .replace("{{DATE}}", y["report"]["date"]).replace("{{TABLE}}", table_html(y["table"], y.get("short", [])))
               .replace("{{SHORT}}", short_html(repos, y.get("short", []))).replace("{{COMPACT}}", compact_html(repos, y.get("compact", [])))
               .replace("{{CARDS}}", "\n".join(cards)).replace("{{DIFF}}", diff_html(tests)))
    for k, s in shas.items():
        page = page.replace("{{SHA:" + k + "}}", s).replace("{{URL:" + k + "}}", f'{repos[k]["url"]}/tree/{repos[k]["sha"]}')
    page = re.sub(r"(?<=\d) %", "\u00a0%", page)
    open(os.path.join(OUT, "index.html"), "w").write(page)
    single = os.path.join(OUT, "index.single.html")
    if "--single" not in args and os.path.exists(single):
        os.remove(single)   # never publish a stale single-file copy
    if "--single" in args:
        def inline(m):
            p = os.path.join(OUT, m.group(1))
            return 'src="data:audio/wav;base64,' + base64.b64encode(open(p, "rb").read()).decode() + '"'
        open(os.path.join(OUT, "index.single.html"), "w").write(re.sub(r'src="(assets/[^"]+\.wav)"', inline, page))
    json.dump(manifest, open(os.path.join(OUT, "build-manifest.json"), "w"), indent=1)
    print("wrote", os.path.join(OUT, "index.html"))

if __name__ == "__main__":
    main()
