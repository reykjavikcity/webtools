import { expect, test } from 'bun:test';

import type { WaitComponent, WaitProps } from './Wait.js';
import { Wait } from './Wait.js';
import * as moduleExports from './Wait.js';

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */

  // ---------------------------------------------------------------------------
  // Test exports

  const exports: Record<keyof typeof moduleExports, true> = {
    Wait: true,
  };

  type WaitProps_is_exported = WaitProps<unknown>;
  type WaitComponent_is_exported = WaitComponent;

  // ---------------------------------------------------------------------------
  // Test types

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// ---------------------------------------------------------------------------
// Test methods

test('Wait', () => {
  expect(Wait).toBeFunction();
});
