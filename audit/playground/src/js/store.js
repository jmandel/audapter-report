'use strict';
// Persistence: IndexedDB for the session (kept trials and their inputs), zip export/import (session.json + float WAVs),
// settings as JSON files and as a shareable URL hash.
PG.Store = (() => {
  const DB = 'audapter-playground', VER = 1;
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    if (!self.indexedDB) return rej(new Error('IndexedDB unavailable'));
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => { const d = r.result; for (const s of ['inputs', 'trials', 'meta']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (store, mode, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction(store, mode); const o = fn(t.objectStore(store)); t.oncomplete = () => res(o && o.result); t.onerror = () => rej(t.error); }); };
  const put = (s, k, v) => tx(s, 'readwrite', o => o.put(v, k)).catch(e => console.warn('store', e));
  const del = (s, k) => tx(s, 'readwrite', o => o.delete(k)).catch(() => {});
  const all = async s => { const d = await open(); return new Promise((res, rej) => { const out = []; const c = d.transaction(s).objectStore(s).openCursor(); c.onsuccess = () => { const x = c.result; if (x) { out.push(x.value); x.continue(); } else res(out); }; c.onerror = () => rej(c.error); }); };

  const slim = t => ({ ...t, result: t.result ? { ...t.result } : null });
  async function saveTrial(t) {
    if (!t.kept) return;
    const inp = PG.state.inputs.get(t.inputId);
    if (inp) await put('inputs', inp.id, { id: inp.id, kind: inp.kind, label: inp.label, meta: inp.meta || {}, x: inp.x instanceof Float32Array ? inp.x : Float32Array.from(inp.x) });
    await put('trials', t.id, slim(t));
  }
  const deleteTrial = id => del('trials', id);
  const saveSettings = s => put('meta', 'settings', s);
  async function load() {
    try {
      const [inputs, trials, meta] = await Promise.all([all('inputs'), all('trials'), tx('meta', 'readonly', o => o.get('settings'))]);
      for (const i of inputs) i.x = Float64Array.from(i.x);
      return { inputs, trials: trials.sort((a, b) => a.created - b.created), settings: meta || null };
    } catch (e) { console.warn('session restore failed', e); return { inputs: [], trials: [], settings: null }; }
  }
  async function clearAll() { for (const s of ['inputs', 'trials']) await tx(s, 'readwrite', o => o.clear()).catch(() => {}); }

  // ---- zip (store method, no compression) with CRC-32
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {   // files: [{name, data: Uint8Array}]
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), n = f.data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true);
      h.setUint32(18, n, true); h.setUint32(22, n, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true);
      c.setUint32(20, n, true); c.setUint32(24, n, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + n;
    }
    const csize = central.reduce((s, p) => s + p.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
  }
  function unzip(u8) {   // stored entries only (what zip() writes)
    const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), dec = new TextDecoder(), out = {};
    let e = u8.length - 22; while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('not a zip file');
    let p = v.getUint32(e + 16, true);
    for (let k = 0; k < v.getUint16(e + 10, true); k++) {
      const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      if (method !== 0) throw new Error(`${name}: compressed zip entries are not supported (use a session exported by the playground)`);
      const ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true);
      out[name] = u8.subarray(ds, ds + size);
      p += 46 + nl + xl + cl;
    }
    return out;
  }

  // ---- session export / import
  const DATA_FIELDS = ['frameRate', 'intervals', 'rms', 'fmts', 'rads', 'dfmts', 'sfmts', 'rms_slope', 'ost_stat', 'pitchShiftRatio', 'pitchHz', 'shiftedPitchHz'];
  const arr = a => (a ? (Array.isArray(a) ? a.map(arr) : typeof a === 'number' ? a : Array.from(a)) : a);
  function exportSession(trials) {
    const files = [], enc = new TextEncoder(), inputs = new Map();
    const meta = { format: 'audapter-playground-session', version: 1, exported: new Date().toISOString(), trials: [] };
    for (const t of trials) {
      const inp = PG.state.inputs.get(t.inputId);
      if (inp && !inputs.has(inp.id)) { inputs.set(inp.id, true); files.push({ name: `inputs/${inp.id}.wav`, data: PG.DSP.encodeWav(inp.x, 48000, { float: true }) }); }
      const r = t.result, d = {};
      if (r) {
        for (const k of DATA_FIELDS) d[k] = arr(r[k]);
        files.push({ name: `trials/${t.id}.output.wav`, data: PG.DSP.encodeWav(r.output, 48000, { float: true }) });
        files.push({ name: `trials/${t.id}.signalIn.wav`, data: PG.DSP.encodeWav(r.signalIn, 16000, { float: true }) });
        files.push({ name: `trials/${t.id}.signalOut.wav`, data: PG.DSP.encodeWav(r.signalOut, 16000, { float: true }) });
      }
      meta.trials.push({ id: t.id, name: t.name, tags: t.tags, notes: t.notes, created: t.created, seq: t.seq, variant: t.variant,
        input: inp ? { id: inp.id, kind: inp.kind, label: inp.label, meta: inp.meta } : null, settings: t.settings, summary: t.summary,
        compiled: r && r.compiled, info: r && r.info, data: d });
    }
    files.unshift({ name: 'session.json', data: enc.encode(JSON.stringify(meta)) });
    files.push({ name: 'README.txt', data: enc.encode('Audapter Playground session. session.json holds every trial\'s settings, the compiled OST/PCF, and Audapter\'s getData fields; inputs/ and trials/ hold 32-bit float WAVs (48 kHz input and output, 16 kHz signalIn/signalOut).\n') });
    return zip(files);
  }
  async function importSession(u8) {
    const f = unzip(u8), meta = JSON.parse(new TextDecoder().decode(f['session.json']));
    if (meta.format !== 'audapter-playground-session') throw new Error('session.json is not a playground session');
    const wav = n => (f[n] ? Float64Array.from(PG.DSP.decodeWav(f[n]).x) : null);
    const inputs = new Map(), trials = [];
    for (const m of meta.trials) {
      if (m.input && !inputs.has(m.input.id)) inputs.set(m.input.id, { ...m.input, x: wav(`inputs/${m.input.id}.wav`) });
      const out = wav(`trials/${m.id}.output.wav`);
      const typed = a => (Array.isArray(a) ? (typeof a[0] === 'number' || a.length === 0 ? Float64Array.from(a) : a.map(typed)) : a);
      const result = out ? { output: out, signalIn: wav(`trials/${m.id}.signalIn.wav`), signalOut: wav(`trials/${m.id}.signalOut.wav`), compiled: m.compiled, info: m.info } : null;
      if (result) for (const k of DATA_FIELDS) result[k] = typed(m.data[k]);
      trials.push({ id: m.id, name: m.name, tags: m.tags || [], notes: m.notes || '', created: m.created, seq: m.seq || null, variant: m.variant,
        inputId: m.input && m.input.id, settings: m.settings, summary: m.summary, kept: true, result });
    }
    return { inputs, trials };
  }

  // ---- settings
  const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  function settingsLink(s) {
    const json = JSON.stringify(PG.S.effective(s)), h = '#s=' + b64u(json);
    return h.length > 6000 ? null : location.href.replace(/#.*$/, '') + h;
  }
  function settingsFromHash() {
    const m = /[#&]s=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!m) return null;
    try { return PG.S.normalize(JSON.parse(unb64u(m[1]))); } catch { return null; }
  }
  function download(blob, name) {
    const a = PG.h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  return { saveTrial, deleteTrial, saveSettings, load, clearAll, exportSession, importSession, settingsLink, settingsFromHash, download, zip, unzip };
})();
