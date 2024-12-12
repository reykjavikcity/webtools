import { expect, test } from 'bun:test';

import { isClientFetch } from './http.js';
import * as moduleExports from './http.js';

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */

  // ---------------------------------------------------------------------------
  // Test exports

  const exports: Record<keyof typeof moduleExports, true> = {
    isClientFetch: true,
  };

  // ---------------------------------------------------------------------------
  // Test types

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// ---------------------------------------------------------------------------
// Test methods

test('isClientFetch', () => {
  expect(isClientFetch).toBeFunction();
});
