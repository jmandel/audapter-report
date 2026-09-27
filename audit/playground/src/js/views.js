'use strict';
// Tier definitions for one trial: the "Spectrograms" and "Pitch & level" views.
PG.Views = (() => {
  const { h } = PG, TT = PG.Tiers;
  const key = (cls, text) => h('span.lk', {}, h(`span.key.k-${cls}`), text);

  // Per-trial derived series (cached on the trial object).
  function derive(t) {
    if (t._d) return t._d;
    const r = t.result, A = r.analysis, dt = 1 / r.frameRate, n = r.fmts[0].length;
    const m = (r.compiled && r.compiled.meta) || {};
    const S = PG.S.normalize(t.settings);
    const dur = t.inputLen / 48000;
    // pitch: Audapter's logged pitchHz vs the independent YIN estimate on the input
    const hasPitch = r.pitchHz && r.pitchHz.some(v => v > 0);
    const disc = [];
    if (hasPitch) {
      let a = null;
      for (let i = 0; i <= n; i++) {
        const tt = i * dt, k = Math.round(tt / A.f0In.hop), f = A.f0In.f0[k], p = i < n ? r.pitchHz[i] : 0;
        const bad = i < n && f > 0 && p > 0 && (p / f > 1.25 || p / f < 0.8);
        if (bad && a === null) a = tt;
        if (!bad && a !== null) { if (tt - a >= 0.02) { if (disc.length && a - disc[disc.length - 1][1] < 0.03) disc[disc.length - 1][1] = tt; else disc.push([a, tt]); } a = null; }
      }
    }
    // measured pitch shift in the audio: YIN(out) / YIN(in), in semitones
    const f0i = A.f0In.f0, f0o = A.f0Out.f0, pst = new Float32Array(f0i.length).fill(NaN);
    for (let i = 0; i < f0i.length; i++) if (f0i[i] > 0 && f0o[i] > 0) pst[i] = 12 * Math.log2(f0o[i] / f0i[i]);
    const pShifted = TT.runs(pst, A.f0In.hop, v => Number.isFinite(v) && Math.abs(v) > 0.4).filter(x => x.b - x.a > 0.03);
    const moved = i => r.sfmts[0][i] > 0 && (Math.abs(r.sfmts[0][i] - r.fmts[0][i]) > 0.5 || Math.abs(r.sfmts[1][i] - r.fmts[1][i]) > 0.5);
    const fShifted = TT.runs(r.sfmts[0], dt, (v, i) => moved(i));
    let expected = null;
    if (S.when.mode === 'after') expected = [S.when.after, dur];
    if (S.when.mode === 'window') expected = [S.when.after, Math.min(dur, S.when.until)];
    const ost = r.ost_stat, hasOst = !!(r.compiled && r.compiled.ost) || ost.some(v => v > 0);
    const f0med = PG.median(A.f0In.f0), rmsThr = m.rmsThr || PG.S.compile(S).meta.rmsThr;
    return (t._d = { dt, n, m, S, dur, hasPitch, disc, pst, pShifted, fShifted, expected, hasOst, f0med, rmsThr });
  }

  const readAt = (arr, dt, tt) => { const i = Math.round(tt / dt); return i >= 0 && i < arr.length ? arr[i] : NaN; };
  const hz = v => (v > 0 ? Math.round(v) + ' Hz' : '–');

  function waveTier(t) {
    const r = t.result, inp = PG.state.inputs.get(t.inputId).x;
    return { id: 'wave', label: 'Waveform', sub: 'grey heard before, blue after', height: 64, alt: 'Waveform of the input (grey) and the processed output (blue)',
      draw(g, w, hgt, xOf, C, z) {
        const env = (x, style) => {
          const mid = hgt / 2, sc = hgt / 2 - 3;
          g.beginPath();
          const top = [], bot = [];
          for (let px = 0; px < w; px++) {
            const a = Math.max(0, Math.floor((z.t0 + px / w * (z.t1 - z.t0)) * 48000)), b = Math.min(x.length, Math.ceil((z.t0 + (px + 1) / w * (z.t1 - z.t0)) * 48000));
            let mn = 0, mx = 0; for (let i = a; i < b; i++) { if (x[i] < mn) mn = x[i]; if (x[i] > mx) mx = x[i]; }
            top.push(mid - Math.min(1, mx) * sc); bot.push(mid - Math.max(-1, mn) * sc);
          }
          if (style === 'fill') { g.moveTo(0, top[0]); top.forEach((y, i) => g.lineTo(i, y)); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(i, bot[i]); g.closePath(); g.fillStyle = C.input; g.fill(); }
          else { g.strokeStyle = C.obs; g.lineWidth = 1; g.moveTo(0, top[0]); top.forEach((y, i) => g.lineTo(i, y)); g.stroke(); g.beginPath(); g.moveTo(0, bot[0]); bot.forEach((y, i) => g.lineTo(i, y)); g.stroke(); }
        };
        env(inp, 'fill'); env(r.output, 'line');
        const clip = TT.runs(r.output, 1 / 48000, v => Math.abs(v) >= 0.999).map(x => [x.a - 0.002, x.b + 0.002]);
        if (clip.length) TT.bands(g, clip, xOf, hgt, C, 'clipped');
      },
      readout: tt => [{ label: 'input sample', value: (inp[Math.round(tt * 48000)] || 0).toFixed(3), style: 'input' }, { label: 'output sample', value: (r.output[Math.round(tt * 48000)] || 0).toFixed(3), style: 'obs' }] };
  }

  function specTier(t, which, fmax) {
    const r = t.result, A = r.analysis, d = derive(t);
    const isIn = which === 'in';
    const spec = isIn ? A.specIn : A.specOut;
    const series = isIn
      ? [{ y: r.fmts[0], dt: d.dt, style: 'observed' }, { y: r.fmts[1], dt: d.dt, style: 'observed' }]
      : [{ y: r.sfmts[0], dt: d.dt, style: 'target' }, { y: r.sfmts[1], dt: d.dt, style: 'target' },
         { y: A.lpcOut.f[0], dt: A.lpcOut.hop, style: 'obsDots', r: 1.6 }, { y: A.lpcOut.f[1], dt: A.lpcOut.hop, style: 'obsDots', r: 1.6 }];
    return { id: 'spec-' + which, label: isIn ? 'Spoken (input)' : 'Heard (output)', height: 170,
      sub: isIn ? 'signalIn, with Audapter\'s tracked F1/F2' : 'signalOut, with the shifted targets and an independent estimate',
      alt: isIn ? 'Spectrogram of the input with the formants Audapter tracked' : 'Spectrogram of the output with Audapter\'s shifted formant targets (sfmts) and an independent LPC estimate of the output formants',
      key: () => h('div.tl-keys', {}, isIn ? key('obs', 'fmts (logged)') : [key('exp', 'sfmts target'), key('obsdot', 'LPC on output')]),
      draw(g, w, hgt, xOf, C) {
        TT.drawSpec(g, spec, xOf, w, hgt, fmax, C);
        const yOf = v => hgt - v / fmax * hgt;
        TT.gridY(g, w, yOf, [1000, 2000, 3000, 4000].filter(v => v < fmax), C, v => v / 1000 + ' kHz');
        for (const s of series) TT.drawSeries(g, s, xOf, yOf, C, w);
      },
      readout: tt => isIn
        ? [{ label: 'F1 tracked', value: hz(readAt(r.fmts[0], d.dt, tt)), style: 'obs' }, { label: 'F2 tracked', value: hz(readAt(r.fmts[1], d.dt, tt)), style: 'obs' }]
        : [{ label: 'F1 target', value: hz(readAt(r.sfmts[0], d.dt, tt)), style: 'exp' }, { label: 'F2 target', value: hz(readAt(r.sfmts[1], d.dt, tt)), style: 'exp' },
           { label: 'F1 in output (LPC)', value: hz(readAt(A.lpcOut.f[0], A.lpcOut.hop, tt)), style: 'obsdot' }] };
  }

  function pitchTier(t) {
    const r = t.result, A = r.analysis, d = derive(t), tds = d.m.tds;
    const all = [...A.f0In.f0, ...A.f0Out.f0, ...(d.hasPitch ? r.pitchHz : [])].filter(v => v > 0);
    const lo = Math.max(40, Math.min(80, ...(all.length ? [Math.min(...all) * 0.85] : [80]))), hi = Math.min(1200, Math.max(400, ...(all.length ? [Math.max(...all) * 1.15] : [400])));
    return { id: 'pitch', label: 'Pitch', sub: d.hasPitch ? 'log scale' : 'log scale; Audapter logged no pitchHz with these settings', height: 150, alt: 'Pitch: independent estimate of the input (grey) and output (blue dots), Audapter\'s logged pitchHz (blue line)',
      key: () => h('div.tl-keys', {}, key('indot', 'F0 in (YIN)'), key('obsdot', 'F0 out (YIN)'), d.hasPitch ? key('obs', 'pitchHz (logged)') : null, tds ? key('exp', 'shiftedPitchHz') : null),
      draw(g, w, hgt, xOf, C) {
        const yOf = v => hgt - 4 - (Math.log(v / lo) / Math.log(hi / lo)) * (hgt - 8);
        TT.bands(g, d.disc, xOf, hgt, C, d.disc.length ? 'logged pitch is not F0' : null);
        TT.gridY(g, w, yOf, [50, 100, 200, 400, 800].filter(v => v > lo && v < hi), C, v => v + ' Hz');
        TT.drawSeries(g, { y: A.f0In.f0, dt: A.f0In.hop, style: 'inDots', r: 2 }, xOf, yOf, C, w);
        if (d.hasPitch) TT.drawSeries(g, { y: r.pitchHz, dt: d.dt, style: 'observed' }, xOf, yOf, C, w);
        if (tds) TT.drawSeries(g, { y: r.shiftedPitchHz, dt: d.dt, style: 'target' }, xOf, yOf, C, w);
        TT.drawSeries(g, { y: A.f0Out.f0, dt: A.f0Out.hop, style: 'obsDots', r: 2 }, xOf, yOf, C, w);
      },
      readout: tt => {
        const o = [{ label: 'F0 input (YIN)', value: hz(readAt(A.f0In.f0, A.f0In.hop, tt)), style: 'indot' }, { label: 'F0 output (YIN)', value: hz(readAt(A.f0Out.f0, A.f0Out.hop, tt)), style: 'obsdot' }];
        if (d.hasPitch) o.push({ label: 'pitchHz (logged)', value: hz(readAt(r.pitchHz, d.dt, tt)), style: 'obs' });
        if (tds) o.push({ label: 'shiftedPitchHz', value: hz(readAt(r.shiftedPitchHz, d.dt, tt)), style: 'exp' });
        const s = readAt(d.pst, A.f0In.hop, tt); if (Number.isFinite(s)) o.push({ label: 'measured shift', value: PG.fmt.signed(s, 2) + ' st', style: 'none' });
        return o;
      } };
  }

  function levelTier(t) {
    const r = t.result, A = r.analysis, d = derive(t);
    const rmsDb = Float32Array.from(r.rms[0], v => (v > 0 ? 20 * Math.log10(v) : NaN)), thrDb = 20 * Math.log10(d.rmsThr);
    return { id: 'level', label: 'Level', sub: 'dBFS, 20 ms RMS', height: 120, alt: 'Level of input (grey) and output (blue) over time, with Audapter\'s tracking threshold',
      key: () => h('div.tl-keys', {}, key('in', 'input'), key('obs', 'output'), key('ref', 'rmsThresh')),
      draw(g, w, hgt, xOf, C) {
        const lo = -75, hi = 0, yOf = v => hgt - 3 - (v - lo) / (hi - lo) * (hgt - 6), ok = v => Number.isFinite(v) && v > lo - 5;
        TT.gridY(g, w, yOf, [-60, -40, -20], C, v => v + ' dB');
        TT.drawSeries(g, { y: A.levIn.db, dt: A.levIn.hop, style: 'input', ok, lw: 2 }, xOf, yOf, C, w);
        TT.drawSeries(g, { y: A.levOut.db, dt: A.levOut.hop, style: 'observed', ok }, xOf, yOf, C, w);
        // Audapter's own RMS (on its internal 16 kHz signal) against its threshold, as a thin ink trace and a hairline
        TT.drawSeries(g, { y: rmsDb, dt: d.dt, style: 'ref', ok, lw: 1 }, xOf, yOf, C, w);
        const y = Math.round(yOf(thrDb)) + 0.5; g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
        g.fillStyle = C.ink2; g.font = '11px ' + PG.css('--serif'); g.textBaseline = 'bottom'; g.textBaseline = 'top'; g.fillText('rmsThresh ' + thrDb.toFixed(0) + ' dB; thin ink: Audapter\'s own RMS', 4, y + 2);
      },
      readout: tt => [{ label: 'input level', value: PG.fmt.db(readAt(A.levIn.db, A.levIn.hop, tt)), style: 'in' }, { label: 'output level', value: PG.fmt.db(readAt(A.levOut.db, A.levOut.hop, tt)), style: 'obs' },
        { label: 'Audapter RMS', value: (readAt(r.rms[0], d.dt, tt) || 0).toFixed(4) + ` (thr ${d.rmsThr.toFixed(4)})`, style: 'ref' }] };
  }

  function ostTier(t) {
    const r = t.result, d = derive(t);
    const iv = TT.runs(r.ost_stat, d.dt, () => true, v => String(v)).map(x => ({ ...x, kind: x.label === '0' ? 'ctx' : 'obs' }));
    const perturbed = new Set(d.m.perturbStates || []);
    return { id: 'ost', label: 'OST state', sub: 'ost_stat', height: 30, alt: 'Online status tracking state over time',
      draw(g, w, hgt, xOf, C) { TT.drawIntervals(g, iv, xOf, w, hgt, C); },
      readout: tt => [{ label: 'OST state' + (perturbed.has(readAt(r.ost_stat, d.dt, tt)) ? ' (perturbed in the PCF)' : ''), value: String(readAt(r.ost_stat, d.dt, tt)), style: 'obs' }] };
  }
  function trackedTier(t) {
    const r = t.result, d = derive(t);
    const iv = TT.runs(r.rms[0], d.dt, v => v > d.rmsThr).map(x => ({ ...x, kind: 'obs', label: 'above threshold' }));
    return { id: 'voiced', label: 'Tracked', sub: 'Audapter RMS > rmsThresh', height: 26, alt: 'Frames above the tracking threshold',
      draw(g, w, hgt, xOf, C) { TT.drawIntervals(g, iv, xOf, w, hgt, C); } };
  }
  function shiftTier(t) {
    const d = derive(t), S = d.S, items = [], lanes = [];
    if (d.expected) { items.push({ a: d.expected[0], b: d.expected[1], kind: 'exp', label: 'configured', lane: 0 }); }
    if (S.shift.formant.on) d.fShifted.forEach(x => items.push({ ...x, kind: 'obs', label: 'formants', lane: 1 }));
    if (S.shift.pitch.on || S.shift.timing.on) d.pShifted.forEach(x => items.push({ ...x, kind: 'obs', label: 'pitch (measured)', lane: 2 }));
    const used = new Set(items.map(i => i.lane));
    return { id: 'shift', label: 'Shift on', sub: [used.has(0) ? 'hollow: configured' : '', used.has(1) ? 'formants: sfmts ≠ fmts' : '', used.has(2) ? 'pitch: measured in audio' : ''].filter(Boolean).join('; ') || 'nothing shifted',
      height: Math.max(38, 24 * used.size + 4), alt: 'When the perturbation was configured and when it was applied',
      draw(g, w, hgt, xOf, C) { TT.drawIntervals(g, items, xOf, w, hgt, C); } };
  }

  function tiersFor(t, view) {
    const d = derive(t), out = [waveTier(t)];
    if (view === 'spectro') { out.push(specTier(t, 'in', 5000), specTier(t, 'out', 5000)); if (d.hasOst) out.push(ostTier(t)); out.push(shiftTier(t)); }
    else { out.push(pitchTier(t), levelTier(t), trackedTier(t)); if (d.hasOst) out.push(ostTier(t)); out.push(shiftTier(t)); }
    return out;
  }
  // Numbers behind the view (the accessible text alternative).
  function numbers(t) {
    const r = t.result, A = r.analysis, d = derive(t);
    const ratios = k => { const v = []; for (let i = 0; i < d.n; i++) if (r.fmts[k][i] > 0 && r.sfmts[k][i] > 0) v.push(r.sfmts[k][i] / r.fmts[k][i]); return v.length ? PG.median(v) : NaN; };
    const med = a => PG.median(a);
    const rows = [
      ['Frames with a formant shift (sfmts ≠ fmts)', `${r.sfmts[0].filter((v, i) => v > 0 && (Math.abs(v - r.fmts[0][i]) > 0.5 || Math.abs(r.sfmts[1][i] - r.fmts[1][i]) > 0.5)).length} of ${d.n} (${(d.n / r.frameRate).toFixed(2)} s at ${r.frameRate} frames/s)`],
      ['Median sF1 / F1 and sF2 / F2 (logged)', `${Number.isFinite(ratios(0)) ? ratios(0).toFixed(4) : '–'} and ${Number.isFinite(ratios(1)) ? ratios(1).toFixed(4) : '–'}`],
      ['Median tracked F1, F2 (fmts)', `${hz(med(r.fmts[0]))}, ${hz(med(r.fmts[1]))}`],
      ['Median F1, F2 in the output (independent LPC)', `${hz(med(A.lpcOut.f[0]))}, ${hz(med(A.lpcOut.f[1]))}`],
      ['Median F0 input / output (YIN)', `${hz(med(A.f0In.f0))} / ${hz(med(A.f0Out.f0))}`],
      ['Median pitchHz (logged)', d.hasPitch ? hz(med(r.pitchHz)) : 'not logged (0)'],
      ['Level, active RMS', `input ${PG.fmt.db(20 * Math.log10(A.inRms || 1e-9))} FS, output ${PG.fmt.db(20 * Math.log10(A.outRms || 1e-9))} FS (${PG.fmt.db(20 * Math.log10((A.outRms || 1e-9) / (A.inRms || 1e-9)))})`],
      ['Output peak', `${A.outPeak.toFixed(3)}${A.outPeak >= 0.999 ? ' (clipped)' : ''}; loudest 20 ms block ${PG.fmt.db(A.burstDb)} re active RMS`],
      ['OST states reached', [...new Set(r.ost_stat)].join(', ')],
      ['Processing', `${(r.info.processMs || 0).toFixed(0)} ms in the ${r.info.variant} build${r.info.patches && r.info.patches.length ? ' (' + r.info.patches.join(', ') + ')' : ''}; WASM memory ${PG.fmt.mb(r.info.memoryBytes || 0)}`],
    ];
    return rows;
  }
  return { tiersFor, derive, numbers, key, waveTier, specTier, pitchTier, levelTier, ostTier, shiftTier, trackedTier };
})();
