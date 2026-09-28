"""The time-domain shift schedule starts at the first above-threshold frame (report_pitfalls2.m tdsonset)."""
from sketches import dotplot


def rows_(d):
    R = d["rows"]; return R if isinstance(R, list) else [R]


def sketch(d, up):
    lab = lambda c: ("ARCTIC " + c[7:].replace("_", " ")) if c.startswith("arctic_") else ("PVQD " + c[5:-2] + " /a/")
    rows = [(lab(r["clip"]),
             [(1000 * (r["clock_on"] + 0.2 - r["acoustic_on"]), "g0", "shift starts (schedule 0.2 s after the first above-threshold frame)"), (200, "exp", "intended: 0.2 s after acoustic onset")],
             f'+{r["lag_ms"]:.0f} ms') for r in rows_(d)]
    return dotplot.plot("sk-tds-onset", rows, 150, 350, [150, 200, 250, 300, 350], "shift onset after the acoustic onset, ms (schedule step at 0.2 s)",
                        legend=[("exp", "intended: 200 ms after the acoustic onset"), ("g0", "observed: 200 ms after the first above-threshold frame")],
                        desc="Time-domain shift onset relative to acoustic onset, intended vs observed")


def derive(d, up):
    L = [r["lag_ms"] for r in rows_(d)]
    return {"lag_min": min(L), "lag_max": max(L), "n": len(L)}
