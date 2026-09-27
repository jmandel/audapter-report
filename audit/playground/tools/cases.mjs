// Package the captured report test cases (capture/out/<ID>/) into dist/cases/: one classic script per case
// (cases/<ID>.js -> PG.caseLoaded(case)) and content-addressed resources shared between cases (cases/res/<sha>.js ->
// PG.caseRes(sha, res)): trial inputs and long audio-like arrays (datapb) as 24-bit FLAC, other long arrays as float32.
// Case format (version 1): {format, version, id, title, summary, key, card, build, metric, ostStates, switching,
//   inputs: [{res, label, n}], variants: [{name, label, mode, build, stateOffset, setup: [op], trials: [{label, input, ops: [op]}]}],
//   checks: [{label, variant, trial, metric, want, tol}], extra}
// op: {op: 'setParam', name, value | res} | {op: 'ost'|'pcf', text} | {op: 'reset'}; each trial then processes its input.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { CASES, NOT_REPLAYABLE } from './cases.spec.mjs';

export function buildCases({ P, A, DIST, hasFlac }) {
  const out = path.join(DIST, 'cases'), resDir = path.join(out, 'res');
  fs.mkdirSync(resDir, { recursive: true });
  const written = new Set(), index = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pgcase-'));
  function res(x, audio) {
    const buf = Buffer.from(x.buffer, x.byteOffset, x.byteLength), sha = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);
    if (written.has(sha)) return sha;
    let mx = 0; for (const v of x) mx = Math.max(mx, Math.abs(v));
    let r;
    if (mx === 0) r = { kind: 'zeros', n: x.length };
    else if (audio && x.length >= 20000 && mx < 64) {
      const scale = Math.pow(2, Math.ceil(Math.log2(mx * 1.0001)));   // store x / scale in [-1, 1) as 24-bit
      const n = x.length, w = Buffer.alloc(44 + 3 * n);
      w.write('RIFF', 0); w.writeUInt32LE(36 + 3 * n, 4); w.write('WAVE', 8); w.write('fmt ', 12); w.writeUInt32LE(16, 16); w.writeUInt16LE(1, 20); w.writeUInt16LE(1, 22);
      w.writeUInt32LE(48000, 24); w.writeUInt32LE(48000 * 3, 28); w.writeUInt16LE(3, 32); w.writeUInt16LE(24, 34); w.write('data', 36); w.writeUInt32LE(3 * n, 40);
      for (let i = 0; i < n; i++) w.writeIntLE(Math.max(-8388608, Math.min(8388607, Math.round(x[i] / scale * 8388608))), 44 + 3 * i, 3);
      let bytes = w, kind = 'wav24';
      if (hasFlac) { const f = path.join(tmp, sha + '.wav'); fs.writeFileSync(f, w); bytes = execFileSync('flac', ['--silent', '--best', '--no-seektable', '--no-padding', '-c', f], { stdio: ['ignore', 'pipe', 'ignore'] }); kind = 'flac24'; }
      r = { kind, n, scale, b64: bytes.toString('base64') };
    } else r = { kind: 'f32', n: x.length, b64: Buffer.from(Float32Array.from(x).buffer).toString('base64') };
    fs.writeFileSync(path.join(resDir, sha + '.js'), `PG.caseRes(${JSON.stringify(sha)}, ${JSON.stringify(r)});\n`);
    written.add(sha); return sha;
  }
  const f64 = f => { const b = fs.readFileSync(f); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
  for (const [id, spec] of Object.entries(CASES)) {
    const cd = path.join(P, 'capture', 'out', spec.capture || id);
    if (!fs.existsSync(path.join(cd, 'log.json'))) { console.warn(`WARN: case ${id} not captured (run tools/capture-cases.sh ${id})`); index.push({ id, title: spec.title, summary: spec.summary, available: false, why: 'not captured in this build' }); continue; }
    // the card's numbers: the export's data.json (harness output), or the report's merged copy if that is where they are
    let data = null;
    for (const f of [path.join(A, 'harness/oct/out/report', spec.dir, 'blab', 'data.json'), path.join(A, 'report/prototype/assets', spec.dir, 'data.json')]) {
      if (!fs.existsSync(f)) continue;
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      try { spec.checks(d); data = d; break; } catch { /* numbers not in this copy */ }
    }
    if (!data) throw new Error(`${id}: no data.json with the card's numbers`);
    const arrays = {}, inputs = {};
    let capDir = cd;
    const arrRes = k => (arrays[capDir + k] ||= res(f64(path.join(capDir, 'arrays', `${k}.f64`)), true));
    const inRes = k => (inputs[capDir + k] ||= res(f64(path.join(capDir, 'inputs', `${k}.f64`)), true));
    const logs = {}; const logOf = cap => (logs[cap] ||= JSON.parse(fs.readFileSync(path.join(P, 'capture', 'out', cap, 'log.json'), 'utf8')));
    const secsOf = cap => Object.fromEntries([].concat(logOf(cap).sections).map(s => [s.name, [].concat(s.ops)]));
    const conv = o => o.op === 'setParam' ? (o.array ? { op: 'setParam', name: o.name, res: arrRes(o.array) } : { op: 'setParam', name: o.name, value: [].concat(o.value) })
      : o.op === 'ost' || o.op === 'pcf' ? { op: o.op, text: o.text } : { op: o.op };
    const inputList = [];
    const inputIdx = k => { const r = inRes(k); let i = inputList.findIndex(q => q.res === r); if (i < 0) { i = inputList.length; inputList.push({ res: r, n: fs.statSync(path.join(capDir, 'inputs', `${k}.f64`)).size / 8, label: '' }); } return i; };
    const seqLabels = (data.settings && [].concat(data.settings.sequence || []).flat()) || [];
    const tl = spec.trialLabels ? spec.trialLabels(data) : null;
    const variants = spec.variants.map(v => {
      const cap = v.capture || spec.capture || id; capDir = path.join(P, 'capture', 'out', cap);
      const ops = secsOf(cap)[v.section]; if (!ops) throw new Error(`${id}: section ${v.section} not captured`);
      const trials = []; let buf = [];
      for (const o of ops) { if (o.op === 'process') { trials.push({ ops: buf.map(conv), input: inputIdx(o.array) }); buf = []; } else buf.push(o); }
      // split the first trial's prefix into session setup and the trial's own ops, following the second trial's pattern
      let setup = [];
      if (trials.length) {
        const first = trials[0].ops, pat = trials.length > 1 ? trials[1].ops.map(o => o.op + ':' + (o.name || '')) : ['reset:'];
        const tail = first.slice(-pat.length).map(o => o.op + ':' + (o.name || ''));
        const cut = JSON.stringify(tail) === JSON.stringify(pat) ? first.length - pat.length : (first.length && first[first.length - 1].op === 'reset' ? first.length - 1 : first.length);
        setup = first.slice(0, cut); trials[0].ops = first.slice(cut);
      }
      trials.forEach((t, k) => { t.label = (spec.vowels ? `strength ${k < 6 ? 0 : 0.5}, /${spec.vowels[k % 6]}/` : tl ? tl[k] : seqLabels[k]) || `trial ${k + 1}`; });
      // The export ran this section after others in the same process; the first trial of a fresh instance tracks onsets
      // differently (EXP-10), so the replay starts with one uncounted warm-up trial (a copy of the first).
      if (v.warmup && trials.length) trials.unshift({ ...JSON.parse(JSON.stringify(trials[0])), label: 'warm-up (not compared: the first trial of a fresh Audapter tracks onsets differently, EXP-10)', warmup: true });
      return { name: v.name, label: v.label, mode: v.mode, build: v.build || spec.build, stateOffset: v.stateOffset || 0, setup, trials };
    });
    inputList.forEach((q, i) => { q.label = `input ${i + 1} (${(q.n / 48000).toFixed(2)} s)`; });
    const c = { format: 'audapter-playground-case', version: 1, id, title: spec.title, summary: spec.summary, key: spec.key, card: id,
      build: spec.build, metric: spec.metric, ostStates: spec.ostStates, switching: data.settings && data.settings.switching || '',
      inputDesc: data.settings && data.settings.input || '', note: spec.note || '', inputs: inputList, variants, checks: spec.checks(data), extra: spec.intended ? { intended: spec.intended(data) } : {},
      source: `captured from audit/harness/oct/${logOf(spec.capture || id).script} by audit/playground/tools/capture-cases.sh` };
    fs.writeFileSync(path.join(out, `${id}.js`), `/* Audapter Playground test case ${id} (${c.source}). */\nPG.caseLoaded(${JSON.stringify(c)});\n`);
    index.push({ id, title: spec.title, summary: spec.summary, key: spec.key, available: true, trials: variants.map(v => v.trials.length) });
  }
  for (const [id, why] of Object.entries(NOT_REPLAYABLE)) index.push({ id, title: '', summary: '', available: false, why });
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 1));
  return index;
}
