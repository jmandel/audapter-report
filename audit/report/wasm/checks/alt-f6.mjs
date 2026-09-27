// F6 target (a question, not a bug): "bug" here means "the field perturbation re-arms when the formants re-enter the
// field" (the shipped blab behaviour). The alt-f6 variant restores upstream 2.1.5's transDone logic; it must reproduce
// the upstream build's perturbation windows from the harness export (report_f6.m, VARIANT=upstream) to the frame, and be
// bit-identical to shipped on a run where the field is never left (field F1 >= 0 Hz), besides the reference scenarios.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { wav, params } from './util.mjs';
const X = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../harness/oct/out/report/f6');
export const affects = [];
const segs = d => { const s = [], v = d.sfmts[0]; let a = -1;
  for (let i = 0; i <= v.length; i++) { const on = i < v.length && v[i] > 0; if (on && a < 0) a = i; if (!on && a >= 0) { s.push([a / d.frameRate, i / d.frameRate]); a = -1; } }
  return s; };
const fmt = s => s.map(([a, b]) => `${a.toFixed(3)}-${b.toFixed(3)}`).join(', ') || 'none';
const same = (s, u) => s.length === u.length && s.every((x, i) => Math.abs(x[0] - u[i][0]) < 1e-9 && Math.abs(x[1] - u[i][1]) < 1e-9);
const ndiff = (p, q) => { let n = p.length === q.length ? 0 : Infinity; for (let i = 0; i < Math.min(p.length, q.length); i++) if (p[i] !== q[i]) n++; return n; };
export async function target(A) {
  const glide = wav(path.join(X, 'blab', 'dev_glide_48k.wav')), dip = wav(path.join(X, 'blab', 'dev_dip_48k.wav'));
  const up = JSON.parse(fs.readFileSync(path.join(X, 'upstream', 'data.json'))), bl = JSON.parse(fs.readFileSync(path.join(X, 'blab', 'data.json')));
  const rows = g => (g.length && !Array.isArray(g[0]) ? [g] : g);
  const P = params('F6');
  const run = async (v, x, over = {}) => { const a = await A.create(v); a.init('female', { ...P, ...over }); return a.runTrial({ input: x }); };
  const r = {};
  for (const v of ['shipped', 'alt-f6']) r[v] = { g: await run(v, glide), d: await run(v, dip), g0: await run(v, glide, { f1min: 0 }) };
  const S = { g: segs(r.shipped.g), d: segs(r.shipped.d) }, V = { g: segs(r['alt-f6'].g), d: segs(r['alt-f6'].d) };
  const matchBlab = same(S.g, rows(bl.glide_segments)) && same(S.d, rows(bl.dip_segments));
  const matchUp = same(V.g, rows(up.glide_segments)) && same(V.d, rows(up.dip_segments));
  const n0 = ndiff(r.shipped.g0.output, r['alt-f6'].g0.output) + ndiff(r.shipped.g0.signalOut, r['alt-f6'].g0.signalOut) + ndiff(r.shipped.g0.sfmts[0], r['alt-f6'].g0.sfmts[0]);
  return {
    shippedBug: S.g.length > 1 && matchBlab,
    variantBug: V.g.length !== 1 || !matchUp || n0 !== 0,
    shipped: `re-arms on re-entry: glide shifted ${fmt(S.g)} s, dip ${fmt(S.d)} s (${matchBlab ? '=' : '!='} blab harness export)`,
    variant: `alternative: glide shifted ${fmt(V.g)} s, dip ${fmt(V.d)} s (${matchUp ? '=' : '!='} upstream 2.1.5 harness export); ` +
             `field never left (f1min 0): ${n0} values differ from shipped (output/signalOut/sF1)`,
  };
}
