'use strict';
// A line-by-line JavaScript port of Audapter's OST_TAB::osTrack (ost.cpp:334-738 @169cadf), run over the per-frame
// level that Audapter itself logged in a dry run (rms[0] = rms_s, rms[1] = rms_p, rms_slope). It predicts ost_stat for a
// design before the real run. Faithful details: the current frame's rms_rec entry is not yet written when INTENSITY_FALL
// reads it (so it counts as 0); ELAPSED_TIME compares (frame - onset) * frameDur > duration in doubles; the lookup reads
// one past the rule table for the last rule (treated here as +infinity); maxIOI writes statOnsetIndices[stat] (OST-F2)
// unless `patched`.
PG.OstSim = (() => {
  const S = PG.S;
  function run(ostText, fr, frameDur, { patched = false } = {}) {
    const o = S.parseOst(ostText), n = o.rules.length, N = fr.rms.length;
    const out = new Int32Array(N);
    if (!n) return { states: out, supported: true };
    const stat0 = o.rules.map(r => r.stat), mode = o.rules.map(r => S.OST_MODES[r.mode] ? S.OST_MODES[r.mode].code : -1);
    const p1 = o.rules.map(r => (r.p1 === null ? 0 : r.p1)), p2 = o.rules.map(r => (r.p2 === null ? 0 : r.p2)), p3 = o.rules.map(r => (r.p3 === null ? 0 : r.p3));
    const onset = new Int32Array(Math.max(64, n * 4 + 64));
    let stat = 0, stretchCnt = 0, span = 0, lastStatEnd = 0;
    const nLB = Math.floor(0.01 / frameDur + 0.5);
    const rec = i => (i >= 0 && i < N ? fr.rms[i] : 0);
    for (let dc = 0; dc < N; dc++) {
      const rms_s = fr.rms[dc], slp = fr.slope[dc], ratio = fr.rms[dc] / fr.rmsP[dc];
      let out1 = stat, k = -1;
      for (let i = 0; i < n; i++) if (stat >= stat0[i] && stat < (i + 1 < n ? stat0[i + 1] : Infinity)) { k = i; break; }
      if (k >= 0) {
        const t0 = stat0[k], m = mode[k], set = () => { onset[out1] = dc; };
        const minDur = x => Math.floor(x / frameDur + 0.5), minDurF = x => Math.floor(x / frameDur);
        const hold2 = (cond, dur, round) => {   // the common "+2" pattern
          if (stat === t0) { if (cond) { out1 = stat + 1; set(); stretchCnt = 1; } }
          else { if (cond) { stretchCnt++; if (stretchCnt > dur) { out1 = stat + 1; set(); lastStatEnd = dc; } } else out1 = stat - 1; }
        };
        if (m === 1) { if ((dc - onset[stat]) * frameDur > p1[k]) { out1 = stat + 1; set(); } }
        else if (m === 5) hold2(rms_s > p1[k], minDur(p2[k]));
        else if (m === 6) hold2(rms_s > p1[k] && slp > 0, minDur(p2[k]));
        else if (m === 10) hold2(slp > 0, p1[k]);
        else if (m === 11) {
          if (stat === t0) { if (slp < 0) { out1 = stat + 1; set(); stretchCnt = 1; span = slp; } }
          else if (slp < 0) { stretchCnt++; span += slp; if (stretchCnt > p1[k] && span < p2[k]) { out1 = stat + 1; set(); lastStatEnd = dc; } } else out1 = stat - 1;
        }
        else if (m === 12) hold2(slp < p1[k], minDur(p2[k]));
        else if (m === 13) hold2(slp > p1[k], minDur(p2[k]));
        else if (m === 20) {
          const md = minDur(p2[k]); let goet = 0;
          for (let j = 0; j < nLB; j++) { if (dc - j < 0) { goet = 1; break; } if ((j === 0 ? 0 : rec(dc - j)) >= p1[k]) { goet = 1; break; } }
          if (goet === 0 && dc - lastStatEnd > md) { out1 = stat + 1; set(); lastStatEnd = dc; }
        }
        else if (m === 21) hold2(rms_s < p1[k] && slp < 0, minDur(p2[k]));
        else if (m === 30 || m === 31) {
          const c = m === 30 ? 1 / ratio > p1[k] : 1 / ratio < p1[k];
          if (stat === t0) { if (c) { out1 = stat + 1; set(); stretchCnt = 0; } }
          else if (stat - t0 === 1) { if (c) { stretchCnt++; if (stretchCnt > minDurF(p2[k])) { out1 = stat + 1; set(); } } else out1 = stat - 1; }
          else if (1 / ratio < p1[k]) { out1 = stat + 1; set(); lastStatEnd = dc; }
        }
        else if (m === 32) {
          const c = 1 / ratio > p1[k] && rms_s >= 0.0003;
          if (stat === t0) { if (c) { out1 = stat + 1; set(); stretchCnt = 0; } }
          else if (stat - t0 === 1) { if (c) { stretchCnt++; if (stretchCnt > minDurF(p2[k])) { out1 = stat + 1; set(); } } else out1 = stat - 1; }
        }
        else if (m === 40) hold2(rms_s > p1[k] && 1 / ratio > p2[k], minDur(p3[k]));
        else if (m === 45) hold2(rms_s < p1[k] && 1 / ratio < p2[k], minDur(p3[k]));
      }
      for (const q of o.maxIOI) {
        if (stat >= q.stat0 && stat < q.stat1 && (dc - onset[q.stat0]) * frameDur > q.interval) {
          for (let j = stat + 1; j <= q.stat1; j++) onset[patched ? j : stat] = dc;
          out1 = q.stat1;
        }
      }
      stat = out1; out[dc] = stat;
    }
    return { states: out, supported: true };
  }
  // Sounds as Audapter's level rules see them: alternate "sound starts" / "sound ends" rules over the whole input.
  function sounds(fr, frameDur, det) {
    const rules = [];
    for (let k = 0; k < 60; k++) rules.push({ stat: 3 * k, mode: 'INTENSITY_RISE_HOLD', p1: det.onThresh, p2: det.onHold, p3: null }, { stat: 3 * k + 2, mode: 'INTENSITY_FALL', p1: det.offThresh, p2: det.offMin, p3: null });
    rules.push({ stat: 180, mode: 'OST_END', p1: NaN, p2: NaN, p3: null });
    const st = run(S.serializeOst({ rmsSlopeWin: 0.03, rules, maxIOI: [] }), fr, frameDur).states;
    const out = []; let cur = null;
    for (let i = 0; i < st.length; i++) {
      const ph = st[i] % 3, prev = i ? st[i - 1] : 0;
      if (st[i] !== prev) {
        if (ph === 2 && prev % 3 === 1) {   // confirmed: the sound began where state +1 was entered
          let a = i; while (a > 0 && st[a - 1] === st[i] - 1) a--;
          cur = { k: out.length + 1, on: a * frameDur, confirm: i * frameDur };
        }
        if (ph === 0 && st[i] > prev && cur) { cur.off = i * frameDur; out.push(cur); cur = null; }
      }
    }
    if (cur) { cur.off = st.length * frameDur; cur.open = true; out.push(cur); }
    return out;
  }
  return { run, sounds };
})();
