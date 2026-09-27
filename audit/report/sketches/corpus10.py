from sketchlib import *


def sketch(d, up):
    a, f = d["after32"], d["fresh"]
    T = max(d["stall_s"] + 5, a["cpu"][-1][0] + 3 if a["cpu"] else 50)
    s = Sketch("sk-corpus-10", 0, T, "runFrame progress and CPU after a frameLen change, against a fresh session")
    n = d.get("n_frames", 1150)
    nf = f["progress"][-1][1] if f["progress"] else 0; tf = f["t_end"]
    s.intervals("Fresh session", [(0, max(tf, T * 0.004), "", "expected")], h=26, sub=f"all {nf} frames in {tf:.2f} s")
    s.parts.append(f'<text class="sk-note" x="{s.x(T*0.01)+6:.1f}" y="{s.y - 20}">{nf} frames (the whole 4.6 s clip) processed in {tf:.2f} s</text>')
    yo = s.intervals("After a frameLen 32 trial", [(0, a["cpu"][-1][0] if a["cpu"] else T, "runFrame never returns", "observed")], h=26,
                     sub=f'{a["progress"][-1][1] if a["progress"] else 0} frames processed')
    s.band(0, a["cpu"][-1][0] if a["cpu"] else T, yo, yo + 26, "", anchor="start", ty=yo - 4)
    if a["cpu"]:
        s.lines("CPU", [([c[0] for c in a["cpu"]], [c[1] for c in a["cpu"]], "observed")], 0, 110, [0, 50, 100], " %", h=70, sub="hung process")
    s.axis([0, 10, 20, 30, 40, 50] if T >= 50 else [0, 10, 20, 30, 40], "{:g} s")
    return s.svg("In a fresh session the clip is processed in a fraction of a second. After one trial at frameLen 32 / nDelay 5 and a switch "
                 "to 64 / 7, the first runFrame call of the next trial never returns: no frame completes and the process runs at 100 % CPU until killed.")


def derive(d, up):
    a = d["after32"]
    cpu = [c[1] for c in a["cpu"]] or [0]
    return {"cpu_min": min(cpu), "cpu_max": max(cpu), "hang_s": a["cpu"][-1][0] if a["cpu"] else 0,
            "frames_hung": a["progress"][-1][1] if a["progress"] else 0, "frames_fresh": d["fresh"]["progress"][-1][1] if d["fresh"]["progress"] else 0,
            "t_fresh": d["fresh"]["t_end"]}
