// ES-module entry: import { createAudapter } from './web/audapter.mjs'; const a = await createAudapter('patched');
import { AudapterWasm, PARAM_ALIASES } from './audapter-api.mjs';
import DEFAULTS from './audapter-defaults.mjs';
AudapterWasm.DEFAULTS = DEFAULTS;
export async function createAudapter(variant = 'lite', opts = {}) {
  const factory = (await import(`../dist/audapter-${variant}.mjs`)).default;
  return AudapterWasm.create(factory, opts);
}
export { AudapterWasm, PARAM_ALIASES, DEFAULTS };
