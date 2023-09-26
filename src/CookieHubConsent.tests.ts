import { expect, test } from '@jest/globals';

import { CookieHubProvider } from './CookieHubConsent.js';

test('CookieHubProvider', () => {
  expect(!CookieHubProvider).toEqual(false);
});

// ---------------------------------------------------------------------------
// Testing exports

/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports-ts, import/first */
import * as moduleExports from './CookieHubConsent.js';

if (false as boolean) {
  const exports: Record<keyof typeof moduleExports, true> = {
    CookieHubProvider: true,
    useCookieHubConsent: true,
  };
}
import type { CookieHubProviderProps } from './CookieHubConsent.js';
/* eslint-enable */
