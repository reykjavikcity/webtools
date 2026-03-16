import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { createAlerterStore } from './index.js';
import type { renderAlertMessage } from './react.js';
import { makeReactSubscription } from './react.js';
import * as moduleExports from './react.js';

// ---------------------------------------------------------------------------
// Test exports

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const exports: Record<keyof typeof moduleExports, true> = {
    makeReactSubscription: true,
    renderAlertMessage: true,
  };

  type LinkRenderer_is_exported = renderAlertMessage.LinkRenderer;

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

describe(makeReactSubscription.name, () => {
  beforeAll(() => sessionStorage.clear());
  afterAll(() => sessionStorage.clear());

  test('creates a hook and a component', () => {
    const store = createAlerterStore({ key: 'react' });
    const { useAlerter, AlertsContainer } = makeReactSubscription(store.subscribe);
    expect(useAlerter).toBeFunction();
    expect(AlertsContainer).toBeFunction();
  });
});
