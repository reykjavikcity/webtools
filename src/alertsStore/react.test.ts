import type { renderAlertMessage } from './react.js';
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
