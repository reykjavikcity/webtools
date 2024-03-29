/* eslint-disable deprecation/deprecation */
import { expect, test } from 'bun:test';

import type { SiteImproveProps } from './SiteImprove.js';
import { SiteImprove } from './SiteImprove.js';
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

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// ---------------------------------------------------------------------------
// Test methods

test('SiteImprove', () => {
  expect(!SiteImprove).toEqual(false);
});
