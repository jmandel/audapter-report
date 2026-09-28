// Build the Audapter Playground into audit/playground/dist/ (a self-contained static site).
//   node audit/playground/tools/build.mjs          (audit/playground/build.sh calls this)
// Inputs (all repo-relative):
//   audit/playground/src/**                 page, styles, classic scripts, worker code
//   audit/wasm/lib/audapter-{lite,patched,full}.js   single-file WASM bundles (built by audit/wasm/build.sh)
//   audit/wasm/web/audapter-defaults.mjs    blab defaults recorded from AudapterIO('init')
//   blab/audapter_mex/TransShiftMex/Audapter.cpp     the C++ parameter table (names, types, help text)
//   audit/corpus/audio + manifest.csv       bundled clips (CC BY 4.0 and CMU ARCTIC only)
//   audit/report/templates/fonts            Charis SIL (OFL), the report's typeface
// Everything is emitted as classic scripts so the page also works from file:// (except the microphone).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');   // audit/playground
const A = path.resolve(P, '..');                                               // audit
const R = path.resolve(A, '..');                                               // repo root
const SRC = path.join(P, 'src'), DIST = path.join(P, 'dist');
const rd = f => fs.readFileSync(f, 'utf8');

fs.rmSync(DIST, { recursive: true, force: true });
for (const d of ['', 'js', 'engine', 'clips', 'fonts']) fs.mkdirSync(path.join(DIST, d), { recursive: true });

// ---------- 1. parameter table from the C++ constructor
function paramTable() {
  const cpp = rd(path.join(R, 'blab/audapter_mex/TransShiftMex/Audapter.cpp'));
  const start = cpp.indexOf('Audapter::Audapter()'), end = cpp.indexOf('strcpy_s(deviceName', start);
  const body = cpp.slice(start, end);
  const out = [];
  const re = /params\.add(Bool|Int|Double|IntArray|DoubleArray|Double2DArray)?Param\(\s*"([^"]+)"\s*,((?:\s*"(?:[^"\\]|\\.)*")+)\s*(?:,\s*Parameter::(TYPE_[A-Z0-9_]+))?\s*\)/g;
  let m;
  while ((m = re.exec(body))) {
    const help = [...m[3].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1]).join('').replace(/\\n/g, '\n').trim();
    const line = cpp.slice(0, start + m.index).split('\n').length;
    const type = m[1] ? { Bool: 'bool', Int: 'int', Double: 'double', IntArray: 'int[]', DoubleArray: 'double[]', Double2DArray: 'double[][]' }[m[1]]
      : ({ TYPE_SMN_RMS_FF: 'double[]', TYPE_PVOC_WARP: 'warp', TYPE_TIME_DOMAIN_PITCH_SHIFT_SCHEDULE: 'double[]',
           TYPE_TIME_DOMAIN_PITCH_SHIFT_ALGORITHM: 'enum' }[m[4]] || m[4]);
    out.push({ name: m[2], type, help, line });
  }
  if (out.length < 70) throw new Error(`parameter table parse found only ${out.length} entries`);
  return out;
}
const table = paramTable();

// ---------- 2. defaults (same data the WASM bundles carry)
const defaultsSrc = rd(path.join(A, 'wasm/web/audapter-defaults.mjs')).replace(/^export default /m, 'return ');
const DEFAULTS = new Function(defaultsSrc)();

// ---------- 3. shared code (main thread + worker)
const shared = ['dsp.js', 'settings-core.js'].map(f => rd(path.join(SRC, 'shared', f))).join('\n;\n');
const sharedData = `self.AUD_DEFAULTS = ${JSON.stringify(DEFAULTS)};\nself.AUD_PARAM_TABLE = ${JSON.stringify(table)};\n`;
const workerCode = sharedData + shared + '\n;\n' + rd(path.join(SRC, 'worker', 'engine-worker.js'));

// ---------- 4. WASM engines: one lazily loaded classic script per build, holding the bundle as a string
const VARIANTS = { lite: 'shipped', patched: 'patched', full: 'shipped (full size)' };
// the report's one-fix builds (audit/report/wasm/build-variants.sh): each card's fix alone, used as the test cases' "expected"
const FIXES = { 'fix-ost-f1': 'One fix: OST-F1 (OST state reset per trial)', 'fix-ost-f2': 'One fix: OST-F2 (maxIOI onset index)', 'fix-i-01': 'One fix: I-01 (noise loops at its length)',
  'fix-i-02': 'One fix: I-02 (dScale applied once)', 'fix-pt-5': 'One fix: PT-5 (gain-normalised vocoder)', 'alt-f6': 'F6 alternative: one-shot field rule (not a fix)' };
Object.assign(VARIANTS, FIXES);
const engineInfo = {};
for (const v of Object.keys(VARIANTS)) {
  const f = FIXES[v] ? path.join(A, 'report/prototype/wasm', `audapter-${v}.js`) : path.join(A, 'wasm/lib', `audapter-${v}.js`);
  if (!fs.existsSync(f)) { console.warn(`WARN: ${f} missing; build ${v} will be unavailable (run audit/wasm/build.sh ${v})`); continue; }
  const txt = rd(f);
  fs.writeFileSync(path.join(DIST, 'engine', `engine-${v}.js`),
    `/* Audapter WASM bundle "${v}" (${path.relative(path.join(A, '..'), f)}, Apache-2.0), wrapped in a function whose source text\n` +
    `   (Function.prototype.toString) becomes a Worker blob, so the engine also loads from file://. */\n` +
    `(self.PG_ENGINE_FN = self.PG_ENGINE_FN || {})[${JSON.stringify(v)}] = function () {\n${txt}\n};\n`);
  engineInfo[v] = { label: VARIANTS[v], bytes: txt.length };
}

// ---------- 5. bundled clips: CC BY 4.0 and CMU ARCTIC only (no Praat/GPL, no MIT example data, no Hillenbrand)
function parseCsv(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [h, ...r] = rows; return r.filter(x => x.length > 1).map(x => Object.fromEntries(h.map((k, i) => [k, x[i]])));
}
const manifest = parseCsv(rd(path.join(A, 'corpus/manifest.csv')));
const WANT = ['arctic_slt_a0030', 'arctic_clb_a0036', 'arctic_bdl_a0030', 'arctic_rms_a0018', 'arctic_awb_a0030',
  'libri_84-121123-0000', 'libri_2078-142845-0026', 'so762_0093_103', 'so762_0094_123', 'so762_0112_180',
  'vbd_p257_110_cafe2.5', 'pvqd_LA9003_a', 'pvqd_LA9003_i', 'pvqd_LA9015_a', 'pvqd_LA9015_i', 'pvqd_SJ2001_a',
  'pvqd_NYU1015_a', 'vocalset_f2_long_straight_a', 'vocalset_m2_long_straight_i', 'vocadito_4', 'vocadito_10'];
const allowed = r => /^CC BY 4\.0$/.test(r.license) || /^CMU ARCTIC licence/.test(r.license);
const hasFlac = (() => { try { execFileSync('flac', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const clips = [];
for (const id of WANT) {
  const r = manifest.find(x => x.id === id);
  if (!r) throw new Error(`clip ${id} not in manifest`);
  if (!allowed(r)) throw new Error(`clip ${id} has licence ${r.license}: not allowed in the playground`);
  const wav = path.join(A, 'corpus', r.path);
  let bytes, fmt = 'wav';
  if (hasFlac) {
    bytes = execFileSync('flac', ['--silent', '--best', '--no-seektable', '--no-padding', '-c', wav], { stdio: ['ignore', 'pipe', 'ignore'] }); fmt = 'flac';
  } else bytes = fs.readFileSync(wav);
  fs.writeFileSync(path.join(DIST, 'clips', `${id}.js`), `PG.clipLoaded(${JSON.stringify(id)}, ${JSON.stringify(fmt)}, ${JSON.stringify(bytes.toString('base64'))});\n`);
  clips.push({ id, label: r.content.replace(/\s+/g, ' ').trim(), speaker: r.speaker, sex: r.sex, age: r.age, group: r.group,
    dur: Number(r.dur_s), source: r.source, license: r.license, url: r.source_url, notes: r.notes, bytes: bytes.length });
}
fs.copyFileSync(path.join(A, 'corpus/licenses', fs.readdirSync(path.join(A, 'corpus/licenses')).find(f => /arctic/i.test(f))), path.join(DIST, 'clips', 'CMU-ARCTIC-LICENSE.txt'));
fs.writeFileSync(path.join(DIST, 'clips', 'ATTRIBUTION.md'), '# Bundled speech clips\n\nClips are copied from `audit/corpus` (48 kHz mono, not normalised), ' +
  (hasFlac ? 'losslessly re-encoded as FLAC and ' : '') + 'wrapped in JS for loading from file://.\n\n| id | content | source | licence |\n|---|---|---|---|\n' +
  clips.map(c => `| ${c.id} | ${c.label} | ${c.source} (${c.url}) | ${c.license} |`).join('\n') + '\n');

// ---------- 5b. report test cases (captured command streams) -> dist/cases/
const { buildCases } = await import('./cases.mjs');
const caseIndex = buildCases({ P, A, DIST, hasFlac });
// the list the report build reads to link each card to its test case (kept in the source tree, regenerated here)
fs.writeFileSync(path.join(P, 'cases.json'), JSON.stringify({ note: 'Generated by audit/playground/tools/build.mjs from tools/cases.spec.mjs; read by audit/report/settings_panel.py.',
  cases: caseIndex.map(c => ({ id: c.id, available: c.available, title: c.title || '', why: c.why || '' })) }, null, 1) + '\n');

// ---------- 6. app script, styles, page
const order = rd(path.join(SRC, 'js', 'ORDER')).split(/\s+/).filter(Boolean);
const appJs = `/* Audapter Playground. Apache-2.0. Built by audit/playground/tools/build.mjs. */\n` + sharedData + shared + '\n;\n' +
  `self.PG = self.PG || {};\nPG.WORKER_SRC = ${JSON.stringify(workerCode)};\nPG.ENGINES = ${JSON.stringify(engineInfo)};\nPG.CLIPS = ${JSON.stringify(clips)};\nPG.CASES = ${JSON.stringify(caseIndex)};\n` +
  order.map(f => `\n/* ---- ${f} ---- */\n` + rd(path.join(SRC, 'js', f))).join('\n');
fs.writeFileSync(path.join(DIST, 'js', 'app.js'), appJs);
fs.copyFileSync(path.join(SRC, 'style.css'), path.join(DIST, 'app.css'));
for (const f of fs.readdirSync(path.join(A, 'report/templates/fonts'))) fs.copyFileSync(path.join(A, 'report/templates/fonts', f), path.join(DIST, 'fonts', f));
fs.copyFileSync(path.join(SRC, 'index.html'), path.join(DIST, 'index.html'));
fs.copyFileSync(path.join(R, 'LICENSE'), path.join(DIST, 'LICENSE-apache-2.0.txt'));
fs.writeFileSync(path.join(DIST, 'NOTICE.txt'),
  'Audapter Playground. Code: Apache-2.0 (LICENSE-apache-2.0.txt).\n' +
  'engine/engine-*.js embed the blab-lab Audapter core (audapter_mex, Apache-2.0) compiled to WebAssembly by audit/wasm.\n' +
  'fonts/: Charis SIL, SIL Open Font License 1.1 (https://software.sil.org/charis/).\n' +
  'clips/: speech clips under their own licences, listed in clips/ATTRIBUTION.md (CC BY 4.0 and the CMU ARCTIC licence).\n' +
  'Vowel-space backdrop: average formant values from Peterson & Barney (1952), J. Acoust. Soc. Am. 24, 175-184.\n' +
  'cases/: test-case inputs and parameters captured from the audit report\'s export scripts: synthetic signals, the bundled babble mtbabble48k.wav and the example trial diao1_female from audapter_matlab (MIT, (c) 2006-2021 Audapter Authors).\n');

const size = d => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`cases: ${caseIndex.filter(c => c.available).length} | params: ${table.length} from Audapter.cpp | engines: ${Object.keys(engineInfo).join(', ')} | clips: ${clips.length} (${hasFlac ? 'flac' : 'wav'}) | dist ${(size(DIST) / 1e6).toFixed(2)} MB`);
