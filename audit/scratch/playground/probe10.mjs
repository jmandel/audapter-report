// Vowel variability field (inward / outward) on a synthetic vowel cloud, in node: dispersion ratio from logged sfmts,
// per-token check against the intended line, and the JS port of the 2-D lookup against Audapter per frame.
import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
globalThis.self = globalThis;
globalThis.AUD_DEFAULTS = new Function(fs.readFileSync(ROOT + '/wasm/web/audapter-defaults.mjs', 'utf8').replace(/^export default /m, 'return '))();
for (const f of ['dsp.js', 'settings-core.js']) (0, eval)(fs.readFileSync(ROOT + '/playground/src/shared/' + f, 'utf8'));
const NS = require(ROOT + '/wasm/lib/audapter-lite.js'); const { PGS, DSP } = globalThis;
const med = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : NaN; };
const R = DSP.rng(3), gauss = () => { const u = Math.max(R(), 1e-9), v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const toks = Array.from({ length: 20 }, () => [610 + 50 * gauss(), 1850 + 110 * gauss()]);
async function run(s, x) { const c = PGS.compile(s); const a = await NS.create('lite'); a.setParams(c.list); a.loadOst(''); a.loadPcf(''); a.reset(); a.processBuffer(x); return { d: a.getData(), c }; }
const inputs = toks.map(([f1, f2], k) => DSP.synthVowel({ dur: 0.8, onset: 0.1, offset: 0.7, f0: 210 + 10 * gauss(), formants: [f1, f2, 2900, 3800], level: -20, seed: k + 1 }));
// baseline pass (no shift): spoken medians; centre = median of the token medians
const spoken = [];
for (const x of inputs) { const s = PGS.defaultSettings(); s.shift.formant.on = false; const { d } = await run(s, x); spoken.push([med(Array.from(d.fmts[0]).filter(v => v > 0)), med(Array.from(d.fmts[1]).filter(v => v > 0))]); }
const c1 = med(spoken.map(p => p[0])), c2 = med(spoken.map(p => p[1]));
console.log('centre', c1.toFixed(1), c2.toFixed(1));
for (const dir of ['in', 'out']) {
  const s = PGS.defaultSettings(); s.shift.formant.field = 'variability'; Object.assign(s.shift.formant.vari, { dir, strength: 50, c1, c2, centre: 'manual' });
  const V = PGS.variField(s.shift.formant.vari), k = dir === 'in' ? 0.5 : 1.5;
  let dS = 0, dH = 0, worst = 0, portMis = 0, frames = 0; const rows = [];
  for (let t = 0; t < inputs.length; t++) {
    const { d, c } = await run(s, inputs[t]);
    const idx = []; for (let i = 0; i < d.fmts[0].length; i++) if (d.sfmts[0][i] > 0) idx.push(i);
    const sp = [med(idx.map(i => d.fmts[0][i])), med(idx.map(i => d.fmts[1][i]))], he = [med(idx.map(i => d.sfmts[0][i])), med(idx.map(i => d.sfmts[1][i]))];
    for (const i of idx) { frames++; const a = PGS.apply2D(c.map, d.fmts[0][i], d.fmts[1][i]); if (!a || Math.abs(a[0] - d.sfmts[0][i]) > 1e-6 || Math.abs(a[1] - d.sfmts[1][i]) > 1e-6) portMis++; }
    const want = [c1 + k * (sp[0] - c1), c2 + k * (sp[1] - c2)];
    worst = Math.max(worst, Math.hypot(he[0] - want[0], he[1] - want[1]));
    dS += Math.hypot(sp[0] - c1, sp[1] - c2); dH += Math.hypot(he[0] - c1, he[1] - c2);
    rows.push(`${sp.map(v => v.toFixed(0)).join('/')}->${he.map(v => v.toFixed(0)).join('/')}`);
  }
  console.log(dir, 'dispersion ratio heard/spoken', (dH / dS).toFixed(4), 'worst |heard - intended|', worst.toFixed(2), 'Hz; grid step', V.step1.toFixed(2), '×', V.step2.toFixed(2), 'Hz; JS lookup vs Audapter mismatched frames', portMis, 'of', frames);
  console.log('  ', rows.slice(0, 6).join('  '));
}
