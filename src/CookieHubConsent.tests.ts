import { expect, test } from '@jest/globals';

import { CookieHubProvider } from './CookieHubConsent';

test('CookieHubProvider', () => {
  expect(!CookieHubProvider).toEqual(false);
});

// ---------------------------------------------------------------------------
// Testing exports

/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports-ts, import/first, simple-import-sort/imports */
import * as moduleExports from './CookieHubConsent';

if (false as boolean) {
  const exports: Record<keyof typeof moduleExports, true> = {
    CookieHubProvider: true,
    useCookieHubConsent: true,
  };
}
import type { CookieHubProviderProps } from './CookieHubConsent';
/* eslint-enable */
