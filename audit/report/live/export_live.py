#!/usr/bin/env python3
"""Export report assets for the live-audio-path cards (LIVE-3, LIVE-6, LIVE-1 / LIVE-2) from the live line.

  python3 audit/report/live/export_live.py

Reads (never writes) audit/live/: results/*.txt, results/reset_race_burst.wav, work/in/*.wav, work/out/*.npy,
which `audit/live/run.sh build inputs burst mismatch crash uaf tsan resetcheck` produce (fake ASIO driver in docker).
Writes audit/harness/oct/out/report/<slug>/blab/{data.json,*.wav}, the layout build.py reads.
Audio: 48 kHz (device rate, what the headphones get), 16-bit, one shared gain per card.
"""
import json, os, re, sys
import numpy as np
import scipy.io.wavfile as wf

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIT = os.path.dirname(os.path.dirname(HERE))
LIVE = os.path.join(AUDIT, "live")
RES, WIN, WOUT = (os.path.join(LIVE, d) for d in ("results", "work/in", "work/out"))
# LIVE_DIR=<dir with results/ work/> reads another checkout's live run (e.g. a reproduction), for testing only
if os.environ.get("LIVE_DIR"):
    RES, WIN, WOUT = (os.path.join(os.environ["LIVE_DIR"], d) for d in ("results", "work/in", "work/out"))
EXP = os.path.join(AUDIT, "harness", "oct", "out", "report")
FS, BUF = 48000, 96


def need(p):
    if not os.path.exists(p):
        sys.exit(f"export_live: missing {os.path.relpath(p, AUDIT)}; run the audit/live/run.sh step that makes it")
    return p

def npy(name):
    return np.load(need(os.path.join(WOUT, name)))

def mic():
    fs, x = wf.read(need(os.path.join(WIN, "vowel_a.wav")))
    assert fs == FS
    return x.astype(float) if x.ndim == 1 else x[:, 0].astype(float)

def txt(name):
    return open(need(os.path.join(RES, name))).read()

def outdir(slug):
    d = os.path.join(EXP, slug, "blab"); os.makedirs(d, exist_ok=True); return d

def wavgroup(d, clips, gain=None, target_dbfs=-20, peak_dbfs=-1, thr=1e-3):
    """Python twin of harness/oct/report_wavgroup.m: ONE shared gain; loudest active RMS -> target, capped so no clip
    peaks above -1 dBFS (or an explicit gain). clips: dicts name, x, label, warn."""
    act, pk = [], []
    for c in clips:
        x = np.asarray(c["x"], float); w = round(0.02 * FS); nb = len(x) // w
        b = x[:nb * w].reshape(nb, w); br = np.sqrt((b ** 2).mean(1)); a = b[br > thr]
        act.append(np.sqrt((a ** 2).mean()) if a.size else 0.0); pk.append(np.abs(x).max())
    g = gain if gain is not None else min(10 ** (target_dbfs / 20) / max(act), 10 ** (peak_dbfs / 20) / max(pk))
    man = []
    for c, a, p in zip(clips, act, pk):
        y = np.clip(np.round(g * np.asarray(c["x"], float) * 32767), -32768, 32767).astype(np.int16)
        wf.write(os.path.join(d, c["name"] + ".wav"), FS, y)
        man.append({"file": c["name"] + ".wav", "label": c["label"], "dur_s": len(c["x"]) / FS,
                    "active_rms_dbfs": 20 * np.log10(max(a, 1e-12)), "peak_dbfs": 20 * np.log10(max(p, 1e-12)),
                    "warn": c.get("warn", "")})
    print(f"wavgroup {os.path.relpath(d, AUDIT)}: shared gain {20*np.log10(g):.2f} dB, {len(clips)} clips")
    return man, g

def dump(d, obj):
    def fix(v):
        if isinstance(v, (np.floating,)): return float(v)
        if isinstance(v, (np.integer,)): return int(v)
        if isinstance(v, np.ndarray): return [fix(u) for u in v.tolist()]
        if isinstance(v, dict): return {k: fix(u) for k, u in v.items()}
        if isinstance(v, (list, tuple)): return [fix(u) for u in v]
        if isinstance(v, float): return float(f"{v:.6g}")
        return v
    json.dump(fix(obj), open(os.path.join(d, "data.json"), "w"))
    print("wrote", os.path.relpath(os.path.join(d, "data.json"), AUDIT))

def blockmax(x, n):
    m = len(x) // n
    return np.abs(x[:m * n]).reshape(m, n).max(1)

def db(v, floor=-80):
    return [max(floor, 20 * np.log10(u)) if u > 0 else floor for u in v]


# ----------------------------------------------------------------------------------------------- LIVE-3
def live3():
    d = outdir("live-3")
    x = npy("burst_resetp_hw.npy")[:, 0]          # headphone signal, hardware time, float64 device (true peaks)
    ref = npy("burst_refp_hw.npy")[:, 0]          # same config, no resets while running
    m = mic(); L = len(m)
    bt = txt("burst.txt")
    n_ops = int(re.search(r"op=reset: (\d+) iterations in ([\d.]+) s", bt).group(1))
    secs = float(re.search(r"op=reset: \d+ iterations in ([\d.]+) s", bt).group(1))
    op_med = float(re.search(r"op duration median ([\d.]+) ms", bt).group(1))
    ctrl = float(re.search(r"race-free reset every 25 frames \(offline\): max\|out\| ([\d.]+)", bt).group(1))
    refpk = np.abs(ref).max()
    # bursts, as analysis/bursts.py counts them (96-sample blocks above 2x the normal peak)
    e = blockmax(x, BUF); nb = len(e)
    ev = np.where(e > 2 * refpk)[0]
    groups = np.split(ev, np.where(np.diff(ev) > 5)[0] + 1) if len(ev) else []
    if not groups:
        # no burst in this run: record the counts and say so (the card renders a short note instead of the figure)
        dump(d, {"no_event": f"This run ({n_ops} resets in {secs:.0f} s while a vowel played) produced no burst above twice the normal peak.",
                 "n_resets": n_ops, "run_s": secs, "n_bursts": 0, "ref_peak": refpk, "control_peak": ctrl})
        return
    gi = int(np.argmax([e[g].max() for g in groups])); g = groups[gi]
    ipk = int(np.argmax(np.abs(x)))
    # every reset that lands during voicing zeroes the output buffers: a run of near-silent 2 ms blocks while the
    # (2-buffer-delayed) input is voiced. That is how we count "resets during voicing" and locate each reset.
    phb = ((np.arange(nb) * BUF - 2 * BUF) % L) / FS
    em = blockmax(m, BUF); von = np.where(em > 0.01)[0]
    v0, v1 = von[0] * BUF / FS + 0.05, von[-1] * BUF / FS - 0.05
    voiced = (phb > v0) & (phb < v1)
    low = np.where((e < 0.005) & voiced)[0]
    drops = np.split(low, np.where(np.diff(low) > 1)[0] + 1)
    drops = [q for q in drops if len(q)]
    dstart = np.array([q[0] for q in drops]); dlen = np.array([len(q) for q in drops])
    # Locate the racing reset. The driver does not time-stamp its reset calls (it logs only their durations and the
    # callbacks' start/duration, which do not mark resets), so use the output: every reset during voicing zeroes the
    # buffers, i.e. a near-silent dropout. Take the nearest dropout start up to 60 blocks (120 ms, more than one 50 ms
    # reset period) before the burst onset; if the burst shape hides the dropout, anchor on the burst onset instead.
    pre = dstart[(dstart <= g[0]) & (dstart >= g[0] - 60)]
    if len(pre):
        k_race = int(pre.max()); located = "nearest output dropout before the burst"
    else:
        k_race = max(int(g[0]) - 1, 0); located = "burst onset (no dropout found before it)"
    t_reset = k_race * BUF                       # sample index where the output first falls silent
    burst_blocks = [q for q in drops]  # noqa
    # expected: another reset that landed at (nearly) the same point of the looped vowel and did not race badly
    ph = lambda s: s % L
    cand = [s * BUF for s in dstart if abs(s - k_race) > 50 and e[s:s + 12].max() <= refpk * 1.05]
    dist = [min(abs(ph(c) - ph(t_reset)), L - abs(ph(c) - ph(t_reset))) for c in cand]
    t_match = cand[int(np.argmin(dist))]; match_off = int(ph(t_match) - ph(t_reset))
    # true-peak / duration numbers
    gs = int(g[0]) * BUF                          # burst onset (sample)
    w0, w1 = min(t_reset, gs) - 5 * BUF, int(g[-1]) * BUF + 20 * BUF
    seg = x[w0:w1]
    above = np.where(np.abs(seg) > refpk)[0]
    ab2 = np.where(np.abs(seg) > 2 * refpk)[0]
    clipped = int(np.sum(np.abs(seg) > 1.0))
    peak = float(np.abs(x).max())
    # verify against the live line's own excerpt (results/reset_race_burst.wav, float32, clipped as a DAC would)
    rwp = os.path.join(RES, "reset_race_burst.wav"); excerpt_ok = None
    if os.path.exists(rwp):
        fs_r, rw = wf.read(rwp)
        a0 = max(0, ipk - 24000)
        excerpt_ok = bool(np.max(np.abs(rw.astype(float) - np.clip(x[a0:a0 + len(rw)], -1, 1))) < 1e-6)
        print("results/reset_race_burst.wav matches this run:", excerpt_ok)
    # envelopes, 1 ms blocks, t = 0 at the reset (output falls silent), -60 .. +80 ms
    E0, E1, eb = -0.060, max(0.080, (gs - t_reset) / FS + 0.030), 48
    def env(sig, t0):
        a = t0 + int(E0 * FS); n = int((E1 - E0) * FS) // eb
        return blockmax(sig[a:a + n * eb], eb)
    env_obs = env(x, t_reset); env_exp = env(x, t_match)
    env_in = blockmax(m[(np.arange(t_reset + int(E0 * FS), t_reset + int(E0 * FS) + len(env_obs) * eb)) % L], eb)
    # waveform inset: -4 .. +14 ms around the reset, every sample (clipped as the DAC plays it)
    I0 = (gs - t_reset) / FS - 0.004 if gs - t_reset > 10 * BUF else -0.004
    I1 = I0 + 0.018
    ia, ib = t_reset + int(I0 * FS), t_reset + int(I1 * FS)
    wave_obs = np.clip(x[ia:ib], -1, 1); wave_exp = x[t_match + int(I0 * FS):t_match + int(I1 * FS)]
    # audio: 1.0 s around the reset
    A0, A1 = -0.5, 0.5
    sl = lambda s0: slice(s0 + int(A0 * FS), s0 + int(A1 * FS))
    clip_in = m[np.arange(t_reset + int(A0 * FS), t_reset + int(A1 * FS)) % L]
    clip_obs = np.clip(x[sl(t_reset)], -1, 1); clip_exp = x[sl(t_match)]
    g = 10 ** (-1 / 20) / np.abs(clip_obs).max()   # burst clip peak at -1 dBFS, others at their true relative level
    man, _ = wavgroup(d, [
        {"name": "input_vowel", "x": clip_in, "label": "Input: the looped vowel at the microphone around the reset"},
        {"name": "output_reset_no_burst", "x": clip_exp, "label": "Output around another reset at the same point of the vowel (no burst)"},
        {"name": "output_reset_burst", "x": clip_obs, "label": "Output around the reset that raced the callback (clipped at full scale, as a DAC plays it)",
         "warn": f"loud click: the burst is played at -1 dBFS here, {20*np.log10(min(peak, 1.0) / max(np.abs(clip_exp).max(), 1e-9)):.0f} dB above the speech; turn the volume down first"}], gain=g)
    rc = txt("resetcheck.txt")
    rcm = re.search(r"(\d+) resets while running: first logged frame != 1 in (\d+); non-contiguous frame clock in (\d+)", rc)
    ts = txt("tsan.txt")
    tsm = re.findall(r"(\d+) reports, (\d+) unique site pairs", ts)[-1]
    dump(d, {
        "source": "audit/live run.sh burst (fake ASIO driver, float64 samples, buffer 96, reset every 50 ms while a looped vowel with F1 +20 % plays)",
        "fs": FS, "buf": BUF, "n_resets": n_ops, "run_s": secs, "reset_op_ms_median": op_med,
        "n_resets_voiced": len(drops), "dropout_ms_median": float(np.median(dlen)) * BUF / FS * 1000,
        "n_bursts": len(groups), "ref_peak": refpk, "control_peak": ctrl, "reset_located_by": located, "excerpt_matches_results_wav": excerpt_ok,
        "burst_peak": peak, "burst_peak_db_re_normal": 20 * np.log10(peak / refpk), "burst_peak_dbfs": 20 * np.log10(peak),
        "burst_ms_above_normal": (above[-1] - above[0] + 1) / FS * 1000, "burst_ms_above_2x": (ab2[-1] - ab2[0] + 1) / FS * 1000,
        "clipped_samples": clipped, "clipped_ms": clipped / FS * 1000,
        "burst_at_s": ipk / FS, "reset_at_s": t_reset / FS, "burst_after_reset_ms": (ipk - t_reset) / FS * 1000,
        "match_at_s": t_match / FS, "match_phase_offset_ms": match_off / FS * 1000,
        "burst_rate_voiced": f"1 in {len(drops)}", "burst_rate_all": f"1 in {n_ops}",
        "env_t0": E0, "env_dt": eb / FS, "env_in_db": db(env_in), "env_exp_db": db(env_exp), "env_obs_db": db(env_obs),
        "wave_t0": I0, "wave_dt": 1 / FS, "wave_obs": wave_obs, "wave_exp": wave_exp,
        "rc_n": int(rcm.group(1)), "rc_bad_first": int(rcm.group(2)), "rc_noncontig": int(rcm.group(3)),
        "tsan_reports": int(tsm[0]), "tsan_pairs": int(tsm[1]),
        "audio_t0": A0, "audio": man,
    })


# ----------------------------------------------------------------------------------------------- LIVE-6
def model_heard(mic_x, n, B, lag):
    """Predicted headphone signal when handleBuffer returns at once: period k plays the user buffer of callback k-1,
    whose first B doubles still hold the mono mic samples of period k-lag, read as interleaved stereo."""
    pred = np.zeros((n, 2))
    for k in range(lag, n // B):
        s = (k - lag) * B
        src = mic_x[s:s + B] if s < len(mic_x) else np.zeros(0)
        src = np.pad(src, (0, B - len(src)))
        ub = np.concatenate([src, np.zeros(B)])
        pred[k * B:(k + 1) * B, 0] = ub[0::2][:B]; pred[k * B:(k + 1) * B, 1] = ub[1::2][:B]
    return pred

def live6():
    d = outdir("live-6")
    m = mic()
    hw = npy("mis128_hw.npy"); base = npy("eq_live_base_hw.npy"); jk = npy("jack_mis128_hw.npy")
    B = 128
    mt = txt("mismatch.txt")
    cbs = int(re.search(r"callbacks (\d+), getData rows (\d+), plhs overflow (\d+)", mt).group(1))
    rows = int(re.search(r"getData rows (\d+)", mt).group(1)); ovf = int(re.search(r"plhs overflow (\d+)", mt).group(1))
    pred = model_heard(m, len(hw), B, 2)
    err = float(np.max(np.abs(hw - pred)))
    jerr = {lag: float(np.max(np.abs(jk - model_heard(m, len(jk), B, lag)))) for lag in (1, 2, 3)}
    jlag = min(jerr, key=jerr.get)
    L = hw[:, 0]; nper = len(L) // B
    half2 = float(np.mean(np.abs(L[:nper * B].reshape(nper, B)[:, B // 2:])))
    v = np.abs(m) > 0.01; n = min(len(m), len(L))
    rms = lambda s: float(np.sqrt(np.mean(s ** 2)))
    rms_heard = rms(L[:n][v[:n]]); rms_mic = rms(m[v]); rms_exp = rms(base[:n, 0][v[:n]])
    # sketch window: 3 device buffers during voicing
    k0 = int(0.60 * FS) // B
    W0, W1 = k0 * B, (k0 + 3) * B
    mic_lead = 2 * B   # the sound of period k is the mic of period k-2
    clips = [{"name": "input_vowel", "x": m, "label": "Input: the vowel at the microphone"},
             {"name": "output_matched_buffer", "x": base[:, 0], "label": "Output with a 96-sample device buffer (= frameLen × downFact): Audapter's processed output"},
             {"name": "output_buffer_128", "x": L, "label": "Output with a 128-sample device buffer: what the participant hears (left channel)",
              "warn": "harsh buzz: the sound is gated on and off 375 times a second"}]
    man, g = wavgroup(d, clips)
    dump(d, {
        "source": "audit/live run.sh mismatch (fake ASIO driver, preferred buffer 128, granularity -1) and eq_live_base (buffer 96)",
        "fs": FS, "buf": B, "frame": 96, "callbacks": cbs, "getdata_rows": rows, "plhs_overflow": ovf,
        "model_err": err, "model_err_db_re_mic_peak": 20 * np.log10(err / np.abs(m).max()),
        "jack_model_err": jerr[jlag], "jack_lag": jlag,
        "half2_mean_abs": half2, "rms_heard": rms_heard, "rms_mic": rms_mic, "rms_expected": rms_exp,
        "heard_re_mic_db": 20 * np.log10(rms_heard / rms_mic), "expected_re_mic_db": 20 * np.log10(rms_exp / rms_mic),
        "gate_hz": FS / B, "buf_ms": B / FS * 1000,
        "win_t0": W0 / FS, "win_k0": k0, "win_mic": m[W0 - mic_lead:W1], "win_mic_t0": (W0 - mic_lead) / FS,
        "win_heard": L[W0:W1], "win_expected": base[W0:W1, 0],
        "audio": man,
    })


# ----------------------------------------------------------------------------------------------- LIVE-1 / LIVE-2
def live12():
    d = outdir("live-1-live-2")
    cur = txt("crash.txt")
    def runs(text):
        out = {}; sec = None
        for line in text.splitlines():
            h = re.match(r"--- (\w+) reload while running, (\d+) ms apart", line)
            if h: sec = (h.group(1), int(h.group(2))); out.setdefault(sec, []); continue
            r = re.match(r"run \d+: (CRASH after|survived) (\d+) reloads", line)
            if r and sec: out[sec].append((r.group(1) == "CRASH after", int(r.group(2))))
        return out
    now = runs(cur)
    earlier = {}
    for op in ("pcf", "ost"):
        for fn, gap in ((f"crash_{op}.txt", 20), (f"crash_{op}_slow.txt", 250)):
            p = os.path.join(WOUT, fn)
            if os.path.exists(p):
                earlier[(op, gap)] = [(a == "CRASH after", int(n)) for a, n in re.findall(r"(CRASH after|survived) (\d+) reloads", open(p).read())]
    pooled = {}
    for op in ("pcf", "ost"):
        rr = [r for src in (now, earlier) for (o, _), v in src.items() if o == op for r in v]
        c = sum(1 for cr, _ in rr if cr); n = sum(k for _, k in rr)
        crash_at = sorted(k for cr, k in rr if cr)
        pooled[op] = {"crashes": c, "reloads": n, "runs": len(rr), "per": round(n / max(c, 1)),
                      "min_at": crash_at[0], "max_at": crash_at[-1],
                      "runs_now": [[g, cr, k] for (o, g), v in now.items() if o == op for cr, k in v],
                      "runs_earlier": [[g, cr, k] for (o, g), v in earlier.items() if o == op for cr, k in v]}
    asan_pcf = [l.strip() for l in cur.splitlines() if "#0" in l and "handleBuffer" in l or "ERROR: AddressSanitizer" in l][:2]
    uaf = txt("uaf.txt")
    uaf_sum = re.findall(r"SUMMARY: AddressSanitizer: (heap-use-after-free [^\n]*)", uaf)
    uaf_iter = re.findall(r"process dying during main-thread op '([^']+)' \(iteration (\d+)\)", uaf)
    plain_segv = re.findall(r"signal 11 during main-thread op '([^']+)' \(iteration (\d+)\)", uaf)
    pvoc = re.search(r"#1 [^\n]*in (Audapter::handleBuffer[^\n]*Audapter\.cpp:\d+)", uaf)
    ts = txt("tsan.txt")
    tsm = re.findall(r"(\d+) reports, (\d+) unique site pairs", ts)[-1]
    tsan_ost = re.search(r"SUMMARY: ThreadSanitizer: SEGV (build/src/ost\.cpp:\d+) in (OST_TAB::osTrack)", ts)
    # TimeDomainShifter UAF detail: first frames of the ASan log kept by the live line
    tdlog = os.path.join(LIVE, "work", "asan", "hammer_tdratio.log")
    td = open(tdlog).read() if os.path.exists(tdlog) else ""
    td_read = re.search(r"#1 0x\w+ in (audapter::TimeDomainShifter::genShiftedPitchCycle\(\) build/src/time_domain_shifter\.cpp:\d+)", td)
    td_free = re.search(r"freed by thread T0 here:(?:.|\n)*?in (Audapter::setGetParam[^\n]*?Audapter\.cpp:\d+)", td)
    td_free = td_free.group(1) if td_free else ""
    dump(d, {
        "source": "audit/live run.sh crash uaf tsan (fake ASIO driver; plain -O2, ASan and TSan builds of the real MEX + audioIO + RtAudio)",
        "pcf": pooled["pcf"], "ost": pooled["ost"],
        "asan_pcf_error": asan_pcf[0] if asan_pcf else "", "asan_pcf_frame": asan_pcf[1] if len(asan_pcf) > 1 else "",
        "uaf_summaries": uaf_sum, "uaf_ops": [[o, int(i)] for o, i in uaf_iter], "plain_segv": [[o, int(i)] for o, i in plain_segv],
        "pvoc_frame": pvoc.group(1) if pvoc else "",
        "tsan_reports": int(tsm[0]), "tsan_pairs": int(tsm[1]),
        "tsan_ost": f"SEGV {tsan_ost.group(1)} in {tsan_ost.group(2)}" if tsan_ost else "",
        "td_read": td_read.group(1) if td_read else "", "td_free": td_free,
        "audio": [],
    })


if __name__ == "__main__":
    which = sys.argv[1:] or ["live3", "live6", "live12"]
    for w in which:
        globals()[w]()
