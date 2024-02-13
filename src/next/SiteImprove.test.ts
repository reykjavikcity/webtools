import { expect, test } from 'bun:test';

import { pingSiteImprove, SiteImprove } from './SiteImprove.js';

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
});

// ---------------------------------------------------------------------------
// Testing exports

/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports-ts, import/first */
import * as moduleExports from './SiteImprove.js';

if (false as boolean) {
  const exports: Record<keyof typeof moduleExports, true> = {
    SiteImprove: true,
    pingSiteImprove: true,
    pingSiteImproveOutbound: true,
  };
}
import type { SiteImproveProps } from './SiteImprove.js';
/* eslint-enable */
