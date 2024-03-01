import { expect, test } from 'bun:test';

import type { CookieHubProviderProps } from './CookieHubConsent.js';
import { CookieHubProvider } from './CookieHubConsent.js';
import * as moduleExports from './CookieHubConsent.js';

// ---------------------------------------------------------------------------
// Test exports

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const exports: Record<keyof typeof moduleExports, true> = {
    CookieHubProvider: true,
    useCookieHubConsent: true,
  };

  type CookieHubProviderProps_is_exported = CookieHubProviderProps;

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// ---------------------------------------------------------------------------
// Test methods

test('CookieHubProvider', () => {
  expect(!CookieHubProvider).toEqual(false);
});
