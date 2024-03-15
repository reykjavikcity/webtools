import { expect, test } from 'bun:test';

import type { SiteImproveProps } from './SiteImprove.js';
import { pingSiteImprove, SiteImprove } from './SiteImprove.js';
import * as moduleExports from './SiteImprove.js';

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // ---------------------------------------------------------------------------
  // Test exports
  const exports: Record<keyof typeof moduleExports, true> = {
    SiteImprove: true,
    pingSiteImprove: true,
    pingSiteImproveOutbound: true,
  };

  // ---------------------------------------------------------------------------
  // Test types

  type SiteImproveProps_is_exported = SiteImproveProps;

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// ---------------------------------------------------------------------------
// Test methods

test('SiteImprove', () => {
  expect(!SiteImprove).toEqual(false);
});

test('pingSiteImprove', () => {
  expect(window._sz).toBeUndefined();
  pingSiteImprove('foo', 'submit', 'data');
  const _sz = window._sz || [];
  expect(_sz._jit_defined_).toBe(true);
  expect(_sz.at(-1)).toEqual(['event', 'foo', 'submit', 'data']);
  pingSiteImprove('foo', 'reset');
  expect(_sz.at(-1)).toEqual(['event', 'foo', 'reset']);
  delete window._sz;
});
