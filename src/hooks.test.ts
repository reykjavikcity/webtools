import { describe, expect, test } from 'bun:test';

import * as moduleExports from './hooks.js';
import { useDebounced, useThrottled } from './hooks.js';

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */

  // ---------------------------------------------------------------------------
  // Test exports

  const exports: Record<keyof typeof moduleExports, true> = {
    useDebounced: true,
    useThrottled: true,
  };

  // ---------------------------------------------------------------------------
  // Test types

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// ---------------------------------------------------------------------------
// Test methods

describe('useDebounced', () => {
  test('is a function', () => {
    expect(typeof useDebounced).toBe('function');
  });
});

describe('useThrottled', () => {
  test('is a function', () => {
    expect(typeof useThrottled).toBe('function');
  });
});
