import { describe, expect, test } from 'bun:test';

import { maxWait, promiseAllObject, sleep } from './async.js';
import * as moduleExports from './async.js';

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */

  // ---------------------------------------------------------------------------
  // Test exports

  const exports: Record<keyof typeof moduleExports, true> = {
    sleep: true,
    maxWait: true,
    promiseAllObject: true,
  };

  // ---------------------------------------------------------------------------
  // Test types

  const promiseMap = {
    foo: 'A',
    bar: Promise.resolve('B' as const),
    baz: sleep(10).then(() => 'C' as const),
    smu: undefined,
    fle: false,
  } as const;

  const res1: Promise<{ foo: 'A'; bar: 'B'; baz: 'C'; smu: undefined; fle: false }> =
    promiseAllObject(promiseMap);

  const res2: Promise<{
    foo?: { value: 'A' };
    bar?: { value: 'B' };
    baz?: { value: 'C' };
    smu?: { value: undefined };
    fle?: { value: false };
  }> = maxWait(10, promiseMap);

  const res3: Promise<void> = maxWait(10, [Promise.resolve('A')]);

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// ---------------------------------------------------------------------------
// Test methods

describe('sleep', () => {
  test('works', () => {
    expect(sleep(0)).toBeInstanceOf(Promise);
    expect(sleep(10)).toBeInstanceOf(Promise);
    expect(sleep(10)).resolves.toBeUndefined();
    // Negative values are treated as 0
    expect(
      Promise.race([sleep(-100).then(() => 'A'), sleep(10).then(() => 'B')])
    ).resolves.toBe('A');
  });
});

describe('maxWait', () => {
  test('works', () => {
    expect(maxWait(20, [Promise.resolve('A')])).resolves.toBeUndefined();

    expect(
      maxWait(20, {
        foo: sleep(10).then(() => 'A'),
        bar: 'B',
        baz: undefined,
      })
    ).resolves.toEqual({
      foo: { value: 'A' },
      bar: { value: 'B' },
      baz: { value: undefined },
    });

    expect(
      maxWait(10, {
        foo: sleep(20).then(() => 'A'),
        bar: 'B',
      })
    ).resolves.toEqual({
      foo: undefined,
      bar: { value: 'B' },
    });

    expect(
      maxWait(20, {
        foo: sleep(30).then(() => 'A'),
        bar: 'B',
        baz: sleep(10).then(() => 'C'),
      })
    ).resolves.toEqual({
      foo: undefined,
      bar: { value: 'B' },
      baz: { value: 'C' },
    });
  });
});

describe('promiseAllObject', () => {
  test('promiseAllObject', () => {
    expect(promiseAllObject({})).resolves.toEqual({});

    expect(
      promiseAllObject({
        foo: 'A',
        bar: Promise.resolve('B'),
        baz: sleep(10).then(() => 'C'),
        smu: undefined,
        fle: false,
      })
    ).resolves.toEqual({
      foo: 'A',
      bar: 'B',
      baz: 'C',
      smu: undefined,
      fle: false,
    });

    // first errror rejects the promise
    expect(
      promiseAllObject({
        foo: Promise.resolve('A'),
        bar: sleep(10).then(() => Promise.reject('-B')),
        baz: Promise.reject('-C'),
      })
    ).rejects.toBe('-C');

    // @ts-expect-error  (testing wonky input)
    const array: Record<string, unknown> = ['a', 'b', Promise.resolve('c')];
    expect(promiseAllObject(array)).resolves.toEqual({ 0: 'a', 1: 'b', 2: 'c' });

    // @ts-expect-error  (testing bad input)
    const undef: Record<string, unknown> = undefined;
    expect(() => promiseAllObject(undef)).toThrow();
  });
});
