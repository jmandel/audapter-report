// Build lib/audapter-<variant>.js: a single classic script (emscripten SINGLE_FILE glue + web/audapter-api.mjs +
// defaults) that works from file:// and registers itself on globalThis.Audapter:
//   <script src="audapter-lite.js"></script><script src="audapter-patched.js"></script>
//   const a = await Audapter.create('patched'); a.init('female'); const r = a.runTrial({input, ost, pcf});
import fs from 'node:fs';
const [variant, gluePath, outPath] = process.argv.slice(2);
const W = new URL('..', import.meta.url);
const strip = s => s.replace(/^export default /m, 'const AUDAPTER_DEFAULTS = ').replace(/^export (const|class|function) /gm, '$1 ');
const api = strip(fs.readFileSync(new URL('web/audapter-api.mjs', W), 'utf8'));
const defs = strip(fs.readFileSync(new URL('web/audapter-defaults.mjs', W), 'utf8'));
const glue = fs.readFileSync(gluePath, 'utf8');
const out = `/* Audapter (blab-lab TransShiftMex) compiled to WebAssembly - variant "${variant}". Audit prototype, not a validated instrument.
   Usage: <script src="audapter-${variant}.js"></script>
          const a = await Audapter.create('${variant}'); a.init('female', {bShift: 1});
          const r = a.runTrial({input: Float32Array @ 48 kHz, ost: '...', pcf: '...'}); // r.output, r.fmts, r.sfmts, r.ost_stat, ...
   See wasm/README.md "Embedding API". */
(function () {
${glue}
var NS = globalThis.Audapter;
if (!NS || !NS.AudapterWasm) {
${api}
${defs}
  AudapterWasm.DEFAULTS = AUDAPTER_DEFAULTS;
  NS = globalThis.Audapter = {
    AudapterWasm, PARAM_ALIASES, factories: {},
    get variants() { return Object.keys(this.factories); },
    // New wasm instance of the given variant (each holds its own ~150-320 MB heap: create once, reuse).
    async create(variant, opts) {
      variant = variant || Object.keys(this.factories)[0];
      const f = this.factories[variant];
      if (!f) throw new Error('Audapter variant not loaded: ' + variant + ' (loaded: ' + Object.keys(this.factories).join(', ') + ')');
      return AudapterWasm.create(f, opts);
    },
  };
}
NS.factories[${JSON.stringify(variant)}] = __audapterFactory;
if (typeof module === 'object' && module && module.exports !== undefined) module.exports = NS;
})();
`;
fs.writeFileSync(outPath, out);
