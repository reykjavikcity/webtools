import { Equals, Expect } from '@maranomynet/libtools';
import { Cleanup } from '@reykjavik/hanna-utils';
import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';

import type {
  AlerterConfig,
  InferAlerterPayload,
  InferSubscriberAlerts,
} from './index.js';
import { createAlerterStore } from './index.js';
import * as moduleExports from './index.js';

// ---------------------------------------------------------------------------
// Test exports

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const exports: Record<keyof typeof moduleExports, true> = {
    createAlerterStore: true,
  };

  const { alerter, subscribe } = createAlerterStore();

  type AlerterConfig_is_exported = AlerterConfig;
  type InferAlerterPayload_is_exported = InferAlerterPayload<typeof alerter>;
  type InferSubscriberAlerts_is_exported = InferSubscriberAlerts<typeof subscribe>;

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

describe(createAlerterStore.name, () => {
  beforeAll(() => sessionStorage.clear());
  afterAll(() => sessionStorage.clear());

  test('should allow subscribing to alerts', async () => {
    const store = createAlerterStore();
    let lastAlerts: Array<InferSubscriberAlerts<typeof store.subscribe>> = [];
    const cb = mock((alerts) => {
      lastAlerts = alerts;
    });

    type MyPayload = InferAlerterPayload<typeof store.alerter>;
    type _ = Expect<
      Equals<
        Cleanup<MyPayload>,
        {
          message: moduleExports.AlertMessage;
          flags?: Array<string>;
          duration?:
            | 'BLINK'
            | 'SHORT'
            | 'MEDIUM'
            | 'LONG'
            | 'XLONG'
            | 'INDEFINITE'
            | undefined;
          delay?: number;
        }
      >
    >;

    let unsubscribe = store.subscribe(cb);
    await Bun.sleep(50);
    expect(cb).toHaveBeenCalledTimes(0); // Not called yet because of the initial empty state
    store.alerter.success('Test alert 1');
    expect(cb).toHaveBeenCalledTimes(0); // Not called yet because allerts are dispatched asynchronously
    await Bun.sleep(50);
    expect(cb).toHaveBeenCalledTimes(1);
    store.alerter.info({ message: ['Test alert 2'], duration: 'INDEFINITE', delay: 100 });
    await Bun.sleep(50);
    expect(cb).toHaveBeenCalledTimes(1); // not called yet because of the delay
    await Bun.sleep(100);
    expect(cb).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.alerter.error({ message: 'Test alert 3', flags: ['ding'], duration: 'BLINK' });
    await Bun.sleep(50);
    expect(cb).toHaveBeenCalledTimes(2); // not called because we unsubscribed

    unsubscribe = store.subscribe(cb);
    expect(cb).toHaveBeenCalledTimes(2); // not called because async
    await Bun.sleep(50);
    expect(cb).toHaveBeenCalledTimes(3); // called with the current alerts
    const common = {
      id: expect.any(String),
      dismiss: expect.any(Function),
      setFlags: expect.any(Function),
    };
    expect(lastAlerts).toEqual([
      {
        level: 'success',
        message: 'Test alert 1',
        duration: 8_000,
        ...common,
      },
      {
        level: 'info',
        message: ['Test alert 2'],
        ...common,
      },
      {
        level: 'error',
        message: 'Test alert 3',
        flags: ['ding'],
        duration: 2_000,
        ...common,
      },
    ]);
    const prevIdx1 = lastAlerts[1];
    lastAlerts[0]!.dismiss();
    lastAlerts[2]!.dismiss();
    expect(lastAlerts.length).toBe(3); // not removed yet because of the async duration
    await Bun.sleep(50);
    expect(cb).toHaveBeenCalledTimes(4); // called only once for both dismissals
    expect(lastAlerts).toEqual([
      {
        level: 'info',
        message: ['Test alert 2'],
        ...common,
      },
    ]);
    // the remaining alert should keep the same reference
    expect(lastAlerts[0] === prevIdx1).toBe(true);

    lastAlerts[0]!.setFlags(['pristine', 'foo']);
    await Bun.sleep(50);
    expect(lastAlerts[0]).toEqual({
      level: 'info',
      message: expect.arrayContaining(['Test alert 2']),
      flags: ['pristine', 'foo'],
      ...common,
    });
    const prevAlert = lastAlerts[0]!;
    lastAlerts[0]!.setFlags((flags) => flags!.concat('bar'));
    await Bun.sleep(50);
    expect(lastAlerts[0]).toEqual({
      level: 'info',
      message: ['Test alert 2'],
      flags: ['pristine', 'foo', 'bar'],
      ...common,
    });

    // alert should have changed reference
    expect(prevAlert === lastAlerts[0]).toBe(false);
    // The unchanged methods/properties should be stable references
    expect(prevAlert.dismiss === lastAlerts[0]?.dismiss).toBe(true);
    expect(prevAlert.setFlags === lastAlerts[0]?.setFlags).toBe(true);
    expect(prevAlert.message === lastAlerts[0]?.message).toBe(true);
  }, 1000);

  test('repeat instatiations with the same key return existing store', () => {
    const _console_warn = console.warn;
    console.warn = mock(() => undefined);

    const store1 = createAlerterStore();
    const store2 = createAlerterStore();
    expect(store2).toBe(store1);
    const key = 'foobar';
    const store3 = createAlerterStore({ key });
    expect(store3).not.toBe(store1);
    const store4 = createAlerterStore({ key });
    expect(store4).toBe(store3);

    expect(console.warn).toHaveBeenCalledTimes(3);
    console.warn = _console_warn;
  });

  test('Accepts custom storage instances', async () => {
    const key = 'custom';
    const customStorage = new Map<string, string>();
    const store = createAlerterStore({
      key,
      title: true,
      levels: ['foo', 'bar'],
      types: ['toast'],
      durations: { short: 10, long: 100 },
      defaultDuration: 'short',
      storage: {
        getItem: (key: string) => {
          return customStorage.get(key);
        },
        setItem: (key: string, value: string) => {
          customStorage.set(key, value);
        },
      },
    });

    type MyPayload = InferAlerterPayload<typeof store.alerter>;
    type _ = Expect<
      Equals<
        Cleanup<MyPayload>,
        {
          message: moduleExports.AlertMessage;
          flags?: Array<string>;
          duration?: 'short' | 'long';
          delay?: number;
          title?: string;
          type?: 'toast';
        }
      >
    >;

    expect('success' in store.alerter).toBe(false);
    store.alerter.foo({ message: 'Test alert', type: 'toast' });
    expect(customStorage.size).toBe(1);
    expect(customStorage.get(key)).toBeString();
    expect(JSON.parse(customStorage.get(key)!)).toEqual({
      active: [
        {
          level: 'foo',
          message: 'Test alert',
          type: 'toast',
          duration: 10,
          id: expect.any(String),
        },
      ],
      pending: [],
    });

    store.alerter.bar({
      title: 'Hi!',
      message: 'Test alert 2',
      duration: 'long',
      delay: 100,
    });
    expect(JSON.parse(customStorage.get(key)!)).toEqual({
      active: [
        {
          level: 'foo',
          message: 'Test alert',
          type: 'toast',
          duration: 10,
          id: expect.any(String),
        },
      ],
      pending: [
        {
          level: 'bar',
          title: 'Hi!',
          message: 'Test alert 2',
          duration: 100,
          id: expect.any(String),
          showAt: expect.any(Number),
        },
      ],
    });
    await Bun.sleep(150);
    expect(JSON.parse(customStorage.get(key)!)).toEqual({
      active: [
        {
          level: 'foo',
          message: 'Test alert',
          type: 'toast',
          duration: 10,
          id: expect.any(String),
        },
        {
          level: 'bar',
          title: 'Hi!',
          message: 'Test alert 2',
          duration: 100,
          id: expect.any(String),
        },
      ],
      pending: [],
    });
  });

  test('allows default durations by level', async () => {
    const key = 'custom2';
    const customStorage = new Map<string, string>();
    const store = createAlerterStore({
      key,
      levels: ['foo', 'bar'],
      durations: { short: 10, long: 1000 },
      defaultDuration: {
        foo: 'long',
        bar: 'short',
      },
      storage: {
        getItem: (key: string) => customStorage.get(key),
        setItem: (key: string, value: string) => customStorage.set(key, value),
      },
    });

    store.alerter.foo({ message: 'Test alert' });
    store.alerter.bar({ message: 'Test alert' });
    await Bun.sleep(50);
    expect(JSON.parse(customStorage.get(key)!)).toEqual({
      active: [
        {
          level: 'foo',
          message: 'Test alert',
          duration: 1000,
          id: expect.any(String),
        },
        {
          level: 'bar',
          message: 'Test alert',
          duration: 10,
          id: expect.any(String),
        },
      ],
      pending: [],
    });
  });
});
