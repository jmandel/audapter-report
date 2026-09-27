'use strict';
// Input sources: bundled corpus clip, microphone recording, uploaded file, synthetic vowel.
// Peterson & Barney (1952) average formants (Hz) and F0, used for the vowel-space backdrop and the synthesiser.
PG.VOWELS = {
  F0: { men: 132, women: 223, children: 264 },
  list: [['i', 'heed'], ['ɪ', 'hid'], ['ɛ', 'head'], ['æ', 'had'], ['ɑ', 'hod'], ['ɔ', 'hawed'], ['ʊ', 'hood'], ['u', 'who\'d'], ['ʌ', 'hud'], ['ɝ', 'heard']],
  men: [[270, 2290, 3010], [390, 1990, 2550], [530, 1840, 2480], [660, 1720, 2410], [730, 1090, 2440], [570, 840, 2410], [440, 1020, 2240], [300, 870, 2240], [640, 1190, 2390], [490, 1350, 1690]],
  women: [[310, 2790, 3310], [430, 2480, 3070], [610, 2330, 2990], [860, 2050, 2850], [850, 1220, 2810], [590, 920, 2710], [470, 1160, 2680], [370, 950, 2670], [760, 1400, 2780], [500, 1640, 1960]],
  children: [[370, 3200, 3730], [530, 2730, 3600], [690, 2610, 3570], [1010, 2320, 3320], [1030, 1370, 3170], [680, 1060, 3180], [560, 1410, 3310], [430, 1170, 3260], [850, 1590, 3360], [560, 1820, 2160]],
};
PG.talkerFor = preset => (preset === 'child' ? 'children' : preset === 'male' || preset === 'lowvoice' ? 'men' : 'women');

PG.InputUI = (() => {
  const { h } = PG;
  let root, body, info, src = 'clip', rec = null;
  const clipWait = {};
  PG.clipLoaded = (id, fmt, b64) => { const r = clipWait[id]; if (r) r({ fmt, b64 }); };
  function loadClipScript(id) {
    return new Promise((res, rej) => {
      clipWait[id] = res;
      const s = document.createElement('script'); s.src = `clips/${id}.js`; s.onerror = () => rej(new Error(`could not load clips/${id}.js`));
      document.head.append(s); s.onload = () => s.remove();
    });
  }
  const clipInputs = new Map();
  async function loadClipInput(id) {
    if (clipInputs.has(id) && PG.state.inputs.has(clipInputs.get(id).id)) return clipInputs.get(id);
    const meta = PG.CLIPS.find(c => c.id === id);
    const { b64 } = await loadClipScript(id);
    const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const d = await PG.Audio.decode(u8.buffer);
    const inp = { id: PG.uid(), kind: 'clip', clipId: id, label: `${meta.label} (${groupLabel(meta)}, ${meta.id})`, x: d.x, meta: { source: meta.source, license: meta.license, url: meta.url } };
    PG.state.inputs.set(inp.id, inp); clipInputs.set(id, inp);
    return inp;
  }
  async function loadClip(id) { set(await loadClipInput(id)); }
  const groupLabel = c => ({ adult_F: 'woman', adult_M: 'man', child: `child, ${c.age}`, teen_F: `girl, ${c.age}`, singer_F: 'female singer', singer_M: 'male singer', singer_unknown: 'singer' }[c.group] || c.group);

  function set(inp) {
    inp.id = inp.id || PG.uid();
    PG.state.inputs.set(inp.id, inp); PG.state.input = inp;
    PG.bus.emit('input', inp);
  }

  function mount(el) { root = el; render(); PG.bus.on('input', inp => { const sel = PG.$('#clip-sel'); if (sel && inp && inp.clipId) sel.value = inp.clipId; showInfo(inp); }); }
  function render() {
    PG.clear(root);
    const tabs = [['clip', 'Speech clip'], ['synth', 'Synthetic vowel'], ['record', 'Record'], ['upload', 'Upload']];
    const bar = h('div.seg.src-tabs', { role: 'tablist', 'aria-label': 'Input source' }, tabs.map(([k, t]) => h('button', { type: 'button', role: 'tab', id: 'src-' + k, 'aria-selected': String(k === src), text: t,
      on: { click: () => { src = k; render(); } } })));
    body = h('div.src-body', { role: 'tabpanel', 'aria-labelledby': 'src-' + src });
    info = h('p.input-info', { 'aria-live': 'polite' });
    root.append(h('div.src-head', {}, h('h2.grp-title', { text: 'Input' }), bar), body, info);
    ({ clip, record, upload, synth })[src]();
    showInfo(PG.state.input);
  }
  function showInfo(inp) {
    if (!info) return;
    if (!inp) { info.textContent = 'Choose an input to start.'; return; }
    const pk = PG.DSP.peak(inp.x);
    info.textContent = `${inp.label}: ${(inp.x.length / 48000).toFixed(2)} s, peak ${(20 * Math.log10(pk + 1e-12)).toFixed(1)} dBFS${inp.meta && inp.meta.license ? `. ${inp.meta.license.split('(')[0].trim()}, ${inp.meta.source}` : ''}${inp.meta && inp.meta.note ? '. ' + inp.meta.note : ''}`;
  }

  function clip() {
    const groups = {};
    for (const c of PG.CLIPS) (groups[groupLabel(c).replace(/, .*/, '')] ||= []).push(c);
    const sel = h('select', { id: 'clip-sel', 'aria-label': 'Speech clip', on: { change: e => loadClip(e.target.value).catch(err => PG.toast(err.message, 'error')) } },
      h('option', { value: '', text: 'Choose a clip…', disabled: true, selected: !(PG.state.input && PG.state.input.clipId) }),
      Object.entries(groups).map(([g, cs]) => h('optgroup', { label: g }, cs.map(c => h('option', { value: c.id, text: `“${c.label}” ${c.dur.toFixed(1)} s`, selected: PG.state.input && PG.state.input.clipId === c.id })))));
    body.append(h('div.src-row', {}, sel),
      h('p.ctl-desc', { text: 'Real speech from the audit corpus: CMU ARCTIC, LibriSpeech, speechocean762 children, VoiceBank-DEMAND in noise, PVQD sustained vowels (some dysphonic), VocalSet and vocadito singers. 48 kHz, original level.' }));
  }

  function synth() {
    const talker = PG.talkerFor(PG.state.settings.preset);
    const st = synth.state || (synth.state = { vowel: 4, vowel2: -1, f0: PG.VOWELS.F0[talker], f0End: null, dur: 2, level: -20, vib: 0, talker });
    if (st.talker !== talker) { st.talker = talker; st.f0 = PG.VOWELS.F0[talker]; }
    const num = (k, lab, min, max, step, unit) => h('label.syn', {}, h('span', { text: lab }), h('input.num', { type: 'number', min, max, step, value: st[k] ?? '', placeholder: 'same',
      on: { change: e => { st[k] = e.target.value === '' ? null : +e.target.value; } } }), h('span.unit', { text: unit }));
    const vsel = (k, withNone) => h('select', { 'aria-label': k === 'vowel' ? 'Vowel' : 'Glide to', on: { change: e => { st[k] = +e.target.value; } } },
      withNone ? h('option', { value: -1, text: 'no glide', selected: st[k] < 0 }) : null,
      PG.VOWELS.list.map(([ipa, w], i) => h('option', { value: i, text: `/${ipa}/ as in ${w}`, selected: st[k] === i })));
    body.append(h('div.syn-grid', {},
      h('label.syn', {}, h('span', { text: 'Vowel' }), vsel('vowel')),
      h('label.syn', {}, h('span', { text: 'Glide to' }), vsel('vowel2', true)),
      num('f0', 'F0', 50, 600, 1, 'Hz'), num('f0End', 'F0 at end', 50, 600, 1, 'Hz'),
      num('dur', 'Length', 0.5, 9, 0.1, 's'), num('level', 'Level', -50, -3, 1, 'dBFS'), num('vib', 'Vibrato', 0, 100, 5, 'cents')),
      h('div.btnrow', {}, h('button.btn.primary', { type: 'button', text: 'Make vowel', on: { click: make } })),
      h('p.ctl-desc', { text: `Harmonics shaped by four resonances at Peterson & Barney's average formants for ${talker} (1952). Onset at 0.2 s, offset 0.2 s before the end, 30 ms ramps. Pick a vowel on the vowel map to use its formants.` }));
    function make() {
      const V = PG.VOWELS[talker], a = V[st.vowel], b = st.vowel2 >= 0 ? V[st.vowel2] : null;
      const fm = [a[0], a[1], a[2], a[2] + 900], fe = b ? [b[0], b[1], b[2], b[2] + 900] : null;
      const x = PG.DSP.synthVowel({ dur: st.dur, onset: 0.2, offset: Math.max(0.3, st.dur - 0.2), f0: st.f0, f0End: st.f0End || null, formants: fm, formantsEnd: fe, level: st.level, vibratoHz: st.vib ? 5.5 : 0, vibratoCents: st.vib || 0 });
      const ipa = PG.VOWELS.list[st.vowel][0], ipa2 = b ? PG.VOWELS.list[st.vowel2][0] : null;
      set({ kind: 'synth', label: `Synthetic /${ipa}/${ipa2 ? '→/' + ipa2 + '/' : ''}, F0 ${st.f0}${st.f0End ? '→' + st.f0End : ''} Hz`, x, meta: { synth: { ...st, formants: fm, formantsEnd: fe } } });
    }
    synth.make = make;
    PG.synthPick = (f1, f2) => { const V = PG.VOWELS[talker]; let best = 0, bd = Infinity; V.forEach((v, i) => { const d = Math.hypot(v[0] - f1, (v[1] - f2) / 2); if (d < bd) { bd = d; best = i; } }); st.vowel = best; if (src === 'synth') render(); };
  }

  function record() {
    const meter = h('div.meter', { role: 'meter', 'aria-label': 'Input level', 'aria-valuemin': 0, 'aria-valuemax': 1 }, h('div.meter-fill'));
    const secs = h('select', { 'aria-label': 'Maximum length' }, [2, 3, 5, 8].map(s => h('option', { value: s, text: `${s} s max`, selected: s === 3 })));
    const status = h('span.muted', { 'aria-live': 'polite' });
    const btn = h('button.btn.primary.rec', { type: 'button', id: 'rec-btn', text: 'Record', on: { click: async () => {
      if (rec) { const x = await rec.stop(); return; }
      try {
        btn.textContent = 'Stop'; status.textContent = 'Recording…';
        rec = await PG.Audio.record({ maxSeconds: +secs.value, onLevel: (pk, t) => { meter.firstChild.style.width = Math.min(100, 100 * Math.sqrt(pk)) + '%'; meter.setAttribute('aria-valuenow', pk.toFixed(2)); status.textContent = `Recording ${t.toFixed(1)} s`; } });
        const x = await rec.finished; rec = null; btn.textContent = 'Record';
        const pk = PG.DSP.peak(x);
        status.textContent = pk > 0.99 ? 'The recording clipped; move back from the microphone.' : '';
        set({ kind: 'mic', label: `Recording ${new Date().toLocaleTimeString()}`, x, meta: { rate: 48000 } });
      } catch (e) { rec = null; btn.textContent = 'Record'; status.textContent = ''; PG.toast(e.message || String(e), 'error'); }
    } } });
    body.append(h('div.src-row', {}, btn, secs, meter, status),
      h('p.ctl-desc', { text: 'Record, then process: the page records first and runs Audapter afterwards, so this is not real-time feedback. Echo cancellation, noise suppression and automatic gain are off.' }));
  }

  function upload() {
    const f = h('input', { type: 'file', id: 'file-in', accept: 'audio/*,.wav,.flac', on: { change: async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const d = await PG.Audio.decode(await file.arrayBuffer());
        set({ kind: 'file', label: file.name, x: d.x, meta: { note: d.resampled ? 'Resampled to 48 kHz by the browser' : '' } });
      } catch (err) { PG.toast(`Could not read ${file.name}: ${err.message}`, 'error'); }
    } } });
    body.append(h('div.src-row', {}, h('label.btn', { for: 'file-in', text: 'Choose a WAV or FLAC file' }), f),
      h('p.ctl-desc', { text: 'Mono or stereo (mixed to mono). Files not at 48 kHz are resampled by the browser; 48 kHz WAVs are read sample-exact. The file stays in this browser.' }));
  }
  return { mount, set, loadClip, loadClipInput, render, makeSynth: () => { if (!synth.make) { src = 'synth'; render(); } synth.make(); } };
})();
