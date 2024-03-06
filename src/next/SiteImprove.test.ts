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

  type SiteImproveProps_is_exported = SiteImproveProps;

  // ---------------------------------------------------------------------------
  // Test types

  const P1: SiteImproveProps = { accountId: '1234' };
  const P2: SiteImproveProps = { scriptUrl: 'asdfasf' };
  // @ts-expect-error  (at least one must be provided)
  const P3: SiteImproveProps = {};
  // @ts-expect-error  (both accountId and scriptUrl are not allowed)
  const P4: SiteImproveProps = { accountId: '1234', scriptUrl: 'asdfasf' };

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
