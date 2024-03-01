import * as moduleExports from './vanillaExtract.js';

// ---------------------------------------------------------------------------
// Testing exports

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const exports: Record<keyof typeof moduleExports, true> = {
    vanillaClass: true,
    vanillaClassNested: true,
    vanillaGlobal: true,
    vanillaNest: true,
    vanillaProps: true,
  };

  /* eslint-enable @typescript-eslint/no-unused-vars */
}
