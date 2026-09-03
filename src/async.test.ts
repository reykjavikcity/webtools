import { describe, expect, mock, test } from 'bun:test';

import {
  addLag,
  cachifyAsync,
  debounce,
  maxWait,
  promiseAllObject,
  sleep,
  throttle,
} from './async.js';
import * as moduleExports from './async.js';
import { Result } from './errorhandling.js';

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */

  // ---------------------------------------------------------------------------
  // Test exports

  const exports: Record<keyof typeof moduleExports, true> = {
    sleep: true,
    addLag: true,
    maxWait: true,
    promiseAllObject: true,
    debounce: true,
    throttle: true,
    cachifyAsync: true,
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
    foo?: PromiseFulfilledResult<'A'> | PromiseRejectedResult;
    bar?: PromiseFulfilledResult<'B'> | PromiseRejectedResult;
    baz?: PromiseFulfilledResult<'C'> | PromiseRejectedResult;
    smu?: PromiseFulfilledResult<undefined> | PromiseRejectedResult;
    fle?: PromiseFulfilledResult<false> | PromiseRejectedResult;
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

    // Passing a signal should work
    const { signal } = new AbortController();
    expect(sleep(10, { signal })).toBeInstanceOf(Promise);
    expect(sleep(10, { signal })).resolves.toBeUndefined();
  });

  test('works with abort signal', () => {
    const abortedSleep = sleep(10, { signal: AbortSignal.abort() });
    expect(abortedSleep).toBeInstanceOf(Promise);
    expect(abortedSleep).rejects.toThrow();

    const controller = new AbortController();
    sleep(10).then(() => controller.abort());
    expect(sleep(15, { signal: controller.signal })).rejects.toThrow();
  });
});

describe('maxWait', () => {
  test('works', () => {
    expect(maxWait(20, [Promise.resolve('A')])).resolves.toBeUndefined();
    expect(maxWait(20, [Promise.reject('Rejected in array')])).resolves.toBeUndefined();

    expect(
      maxWait(20, {
        foo: sleep(10).then(() => 'A'),
        bar: 'B',
        baz: undefined,
        smu: Promise.reject('Rejected promise in maxWait'),
      })
    ).resolves.toEqual({
      foo: { status: 'fulfilled', value: 'A' },
      bar: { status: 'fulfilled', value: 'B' },
      baz: { status: 'fulfilled', value: undefined },
      smu: { status: 'rejected', reason: 'Rejected promise in maxWait' },
    });

    const partiallySettled = maxWait(20, {
      foo: sleep(10).then(() => 'A'),
      fuu: sleep(10).then(() => Promise.reject('slow rejection A')),
      bar: 'B',
      baz: sleep(30).then(() => Promise.reject('slow rejection B')),
      smu: sleep(30).then(() => 'C'),
    });
    const partialResults = {
      foo: { status: 'fulfilled', value: 'A' },
      fuu: { status: 'rejected', reason: 'slow rejection A' },
      bar: { status: 'fulfilled', value: 'B' },
      baz: undefined,
      smu: undefined,
    } as const;

    expect(partiallySettled).resolves.toEqual(partialResults);
    // returned result object should be stable.
    expect(partiallySettled.then(addLag(30))).resolves.toEqual(partialResults);
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

// ---------------------------------------------------------------------------

describe('throttle', () => {
  const prep = (skipFirst?: boolean) => {
    const add = mock((a: number, b: number) => a + b);
    return [add, throttle(add, 20, skipFirst)] as const;
  };
  test('creates a wrapped function', () => {
    const [add, tAdd] = prep();

    expect(tAdd(1, 2)).toBeUndefined(); // throttled Functions don't return anything
    expect(add.mock.lastCall).toEqual([1, 2]);
    expect(add.mock.calls.length).toBe(1);
    expect('finish' in tAdd).toBe(true);
  });

  test('throttled calls wait for the delay', (done) => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);

    setTimeout(() => {
      expect(add.mock.calls.length).toBe(1);
      expect(add.mock.lastCall).toEqual([1, 2]);
      done();
    }, 10);
  });

  test('throttled calls are performed after the delay', (done) => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd(3, 4);

    setTimeout(() => {
      expect(add.mock.calls.length).toBe(2);
      expect(add.mock.lastCall).toEqual([3, 4]);
      done();
    }, 30);
  });

  test('runs the throttled call instantly', () => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd(3, 4);
    tAdd.finish();

    expect(add.mock.calls.length).toBe(2);
    expect(add.mock.lastCall).toEqual([3, 4]);
  });

  test('only runs the throttled call once', () => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd(3, 4);
    tAdd.finish();
    tAdd.finish();
    tAdd.finish();

    expect(add.mock.calls.length).toBe(2);
    expect(add.mock.lastCall).toEqual([3, 4]);
  });

  test('finished calls do not run after the delay', (done) => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd(3, 4);
    tAdd.finish();

    setTimeout(() => {
      expect(add.mock.calls.length).toBe(2);
      expect(add.mock.lastCall).toEqual([3, 4]);
      done();
    }, 30);
  });

  test('can cancel the throttled call', () => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd(3, 4);
    tAdd.finish(true);

    expect(add.mock.calls.length).toBe(1);
    expect(add.mock.lastCall).toEqual([1, 2]);
  });

  test('does not run cancelled calls later', () => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd.finish(true);
    tAdd.finish();

    expect(add.mock.calls.length).toBe(1);
    expect(add.mock.lastCall).toEqual([1, 2]);
  });

  test('`skipFirst` option skips the first call', () => {
    const [add, tAdd] = prep(true);
    tAdd(1, 2);
    tAdd(2, 3);
    expect(add.mock.calls.length).toBe(0);
  });

  test('with `skipFirst` throttled calls are performed after the delay', (done) => {
    const [add, tAdd] = prep(true);
    tAdd(1, 2);
    tAdd(2, 3);

    setTimeout(() => {
      expect(add.mock.calls.length).toBe(1);
      expect(add.mock.lastCall).toEqual([2, 3]);
      done();
    }, 30);
  });

  test('passes `this` to the throttled function', () => {
    const add = mock(function (this: { b: number; c?: number }, a: number) {
      this.c = a + this.b;
    });
    const foo = {
      tAdd: throttle(add, 20),
      b: 10,
      c: -1,
    };

    foo.tAdd(5);
    expect(add.mock.calls.length).toBe(1);
    expect(foo.c).toBe(15);
  });

  test('throttle.d creates a dynamic function', (done) => {
    const throttler = throttle.d(20);
    let sideEffect: number | undefined;
    const add = (a: number, b: number) => {
      sideEffect = a + b;
    };
    const multiply = (a: number, b: number) => {
      sideEffect = a * b;
    };

    throttler(add, 3, 3);
    expect(sideEffect).toBe(6);

    throttler(multiply, 3, 3);
    throttler.finish();
    expect(sideEffect).toBe(9);

    throttler(add, 5, 5);
    throttler(multiply, 5, 5);
    setTimeout(() => {
      expect(sideEffect).toBe(25);
      done();
    }, 30);
  });

  test('throttle.d passes `this` to the dynamic function', () => {
    const foo = {
      do: throttle.d(20),
      b: 10,
      c: -1 as number,
    };
    const add = function (this: typeof foo, a: number) {
      this.c = a + this.b;
    };
    const multiply = function (this: typeof foo, a: number) {
      this.c = a * this.b;
    };

    foo.do(add, 3);
    expect(foo.c).toBe(13);

    foo.do(multiply, 3);
    foo.do.finish();
    expect(foo.c).toBe(30);
  });
});

// ---------------------------------------------------------------------------

describe('debounce', () => {
  const prep = (immediate?: boolean) => {
    const add = mock((a: number, b: number) => a + b);
    return [add, debounce(add, 20, immediate)] as const;
  };

  test('creates a wrapped function', () => {
    const [add, tAdd] = prep();

    expect(tAdd(1, 2)).toBeUndefined(); // debounced Functions don't return anything
    expect(add.mock.calls.length).toBe(0);
    expect('cancel' in tAdd).toBe(true);
  });

  test('debounced calls wait for the delay', (done) => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);

    setTimeout(() => {
      expect(add.mock.calls.length).toBe(0);
      done();
    }, 10);
  });

  test('debounced calls are performed after the delay', (done) => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd(3, 4);

    setTimeout(() => {
      expect(add.mock.calls.length).toBe(1);
      expect(add.mock.lastCall).toEqual([3, 4]);
      done();
    }, 30);
  });

  test('cancel method does not run the debounced call instantly', () => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd.cancel();

    expect(add.mock.calls.length).toBe(0);
  });

  test('cancelled calls do not run after the delay', (done) => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd.cancel();

    setTimeout(() => {
      expect(add.mock.calls.length).toBe(0);
      done();
    }, 30);
  });

  test('cancel method can immediately finish the debounced call', () => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd.cancel(true);

    expect(add.mock.calls.length).toBe(1);
    expect(add.mock.lastCall).toEqual([2, 3]);
  });

  test('cancel method only runs the debounced call once', () => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd.cancel(true);
    tAdd.cancel(true);
    tAdd.cancel(true);

    expect(add.mock.calls.length).toBe(1);
    expect(add.mock.lastCall).toEqual([2, 3]);
  });

  test('cancel method does not run cancelled calls later either', (done) => {
    const [add, tAdd] = prep();
    tAdd(1, 2);
    tAdd(2, 3);
    tAdd.cancel(true);

    setTimeout(() => {
      tAdd.cancel(true);
      expect(add.mock.calls.length).toBe(1);
      expect(add.mock.lastCall).toEqual([2, 3]);
      done();
    }, 30);
  });

  test('skipFirst option skips the first call', () => {
    const [add, tAdd] = prep(true);
    tAdd(1, 2);
    tAdd(2, 3);
    expect(add.mock.calls.length).toBe(1);
    expect(add.mock.lastCall).toEqual([1, 2]);
  });

  test('skipFirst option debounced calls are performed after the delay', (done) => {
    const [add, tAdd] = prep(true);
    tAdd(1, 2);
    tAdd(2, 3);

    setTimeout(() => {
      expect(add.mock.calls.length).toBe(2);
      expect(add.mock.lastCall).toEqual([2, 3]);
      done();
    }, 30);
  });

  test('passes `this` to the debounced function', () => {
    const add = mock(function (this: { b: number; c?: number }, a: number) {
      this.c = a + this.b;
    });
    const foo = {
      tAdd: debounce(add, 20, true),
      b: 10,
      c: -1,
    };
    foo.tAdd(5);

    expect(add.mock.calls.length).toBe(1);
    expect(foo.c).toBe(15);
  });

  test('debounce.d creates a dynamic function', (done) => {
    const debouncer = debounce.d(20, true);

    let sideEffect: number | undefined;
    const add = (a: number, b: number) => {
      sideEffect = a + b;
    };
    const multiply = (a: number, b: number) => {
      sideEffect = a * b;
    };

    debouncer(add, 3, 3);
    expect(sideEffect).toBe(6);

    debouncer(multiply, 3, 3);
    debouncer.cancel(true);
    expect(sideEffect).toBe(9);

    debouncer(add, 5, 5);
    debouncer(multiply, 5, 5);
    setTimeout(() => {
      expect(sideEffect).toBe(25);
      done();
    }, 30);
  });

  test('debounce.d passes `this` to the dynamic function', () => {
    const foo = {
      do: debounce.d(20, true),
      b: 10,
      c: -1 as number,
    };
    const add = function (this: typeof foo, a: number) {
      this.c = a + this.b;
    };
    const multiply = function (this: typeof foo, a: number) {
      this.c = a * this.b;
    };

    foo.do(add, 3);
    expect(foo.c).toBe(13);

    foo.do(multiply, 3);
    foo.do.cancel(true);
    expect(foo.c).toBe(30);
  });
});

// ===========================================================================

describe('cachifyAsync', () => {
  const ttlWait = 330;
  const throttleWait = 110;

  const prep = <T extends Array<unknown> = []>(
    opts?: Omit<Parameters<typeof cachifyAsync>[0], 'fn' | 'ttl' | 'throttle'>,
    lagMs = 0
  ) => {
    let c = 0;
    const meta = {
      up: true,
      fn: mock((..._args: T) =>
        sleep(lagMs).then(() =>
          meta.up
            ? Result.Success(_args.length ? _args : `value${c++ ? ` ${c}` : ''}`)
            : Result.Fail(new Error('Failed'))
        )
      ),
    };
    cachifyAsync.devTTLScaling = 10;
    return [
      meta,
      cachifyAsync({
        ...opts,
        fn: meta.fn,
        ttl: '3s',
        throttle: '1s',
      }),
    ] as const;
  };

  test.concurrent('caches results', async () => {
    const [meta, cachedFn] = prep();
    expect((await cachedFn()).result).toBe('value');
    expect(meta.fn.mock.calls.length).toBe(1);
    await cachedFn();
    await cachedFn();
    expect(meta.fn.mock.calls.length).toBe(1);
    expect((await cachedFn()).result).toBe('value');
    await sleep(ttlWait);
    await cachedFn();
    expect(meta.fn.mock.calls.length).toBe(2);
    expect((await cachedFn()).result).toBe('value 2');
  });

  test.concurrent('caches results based on params', async () => {
    const [meta, cachedFn] = prep<[count: number, note: string]>();
    expect((await cachedFn(1, '')).result).toEqual([1, '']);
    expect(meta.fn.mock.calls.length).toBe(1);
    expect((await cachedFn(1, '')).result).toEqual([1, '']);
    expect(meta.fn.mock.calls.length).toBe(1);
    expect((await cachedFn(3, '.')).result).toEqual([3, '.']);
    expect(meta.fn.mock.calls.length).toBe(2);
    expect((await cachedFn(1, '')).result).toEqual([1, '']);
    await cachedFn(1, '');
    expect(meta.fn.mock.calls.length).toBe(2);
    await sleep(ttlWait);
    await cachedFn(1, '');
    await cachedFn(3, '.');
    expect(meta.fn.mock.calls.length).toBe(4);
  });

  test.concurrent('caches errors', async () => {
    const [meta, cachedFn] = prep();

    // API starts offline
    meta.up = false;
    const r0 = await cachedFn();
    expect(r0.error).toBeInstanceOf(Error);
    expect(r0.result).toBeUndefined();

    // Errors are cached
    await cachedFn();
    expect(meta.fn.mock.calls.length).toBe(1);

    // But only for 100ms
    await sleep(throttleWait);
    await cachedFn();
    expect(meta.fn.mock.calls.length).toBe(2);

    // API is back up
    meta.up = true;
    // After error cache expires call again
    await sleep(throttleWait);
    const r1 = await cachedFn();
    expect(meta.fn.mock.calls.length).toBe(3);
    expect(r1.error).toBeUndefined();
    expect(r1.result).toBe('value');

    // Sucess is cached more than 100 ms
    await sleep(throttleWait);
    await cachedFn();
    await cachedFn();
    await cachedFn();
    expect((await cachedFn()).result).toBe('value');
    expect(meta.fn.mock.calls.length).toBe(3);

    // API goes down again
    meta.up = false;
    await sleep(ttlWait - throttleWait);
    // Cache returns stale success results while API is down
    const r2 = await cachedFn();
    expect(r2.error).toBeUndefined();
    expect(r2.result).toBe('value');
  });

  test.concurrent('Passing `returnStale:false` works', async () => {
    const [meta, cachedFn] = prep({ returnStale: false });

    const r0 = await cachedFn();
    expect(r0.error).toBeUndefined();
    expect(r0.result).toBe('value');

    // Wait until the cache expires
    await sleep(ttlWait);

    // API starts offline
    meta.up = false;
    const r1 = await cachedFn();
    expect(r1.error).toBeInstanceOf(Error);
    expect(r1.result).toBeUndefined();
  });

  test.concurrent('custom `getKey` function', async () => {
    const [meta, cachedFn] = prep<[category: string, count: number]>({
      // getKey intentionally ignores the count parameter.
      getKey: (category, _count) => `${category}`,
    });

    expect((await cachedFn('a', 1)).result).toEqual(['a', 1]);
    expect((await cachedFn('b', 2)).result).toEqual(['b', 2]);
    expect(meta.fn.mock.calls.length).toBe(2);
    // Repeatedly calling `cachedFn` with the same category but different count
    // should return the previously cached result.
    await cachedFn('b', 99);
    await cachedFn('b', 130);
    expect((await cachedFn('b', -7)).result).toEqual(['b', 2]);
    expect(meta.fn.mock.calls.length).toBe(2);
  });

  test.concurrent('returns stale when `patience` runs out', async () => {
    const [meta, cachedFn] = prep({ patience: '1s' }, 160);

    // API is slower than patience, but returns successfully
    // since the cache is empty.
    const r1 = await cachedFn();
    expect(r1.error).toBeUndefined();
    expect(r1.result).toBe('value');
    expect(meta.fn.mock.calls.length).toBe(1);

    // Wait until the cache expires
    await sleep(ttlWait);

    // A stale cache exists so the next call returns the stale result
    const r2 = await cachedFn();
    expect(r2.error).toBeUndefined();
    expect(r2.result).toBe('value');
    expect(meta.fn.mock.calls.length).toBe(2);

    // The last stale cache entry from last time is immetiately returned
    // and the slow API  cal has not yet updated in the background.
    const r3 = await cachedFn();
    expect(r3.error).toBeUndefined();
    expect(r3.result).toBe('value');
    expect(meta.fn.mock.calls.length).toBe(2);

    // wait for the lagging API call to resolve and update the cache
    // in the background
    await sleep(100);
    // the cache entry still exists but has an updated value now
    const r4 = await cachedFn();
    expect(r4.error).toBeUndefined();
    expect(r4.result).toBe('value 2');
    expect(meta.fn.mock.calls.length).toBe(2);
  });

  test.concurrent('`returnStale:false` obviates the `patience` option', async () => {
    const [meta, cachedFn] = prep({ patience: '1s', returnStale: false }, 160);

    const r1 = await cachedFn();
    expect(r1.error).toBeUndefined();
    expect(r1.result).toBe('value');
    expect(meta.fn.mock.calls.length).toBe(1);

    // Wait until the cache expires
    await sleep(ttlWait);

    // A stale cache exists but is not returned (patience is ignored)
    const r2 = await cachedFn();
    expect(r2.error).toBeUndefined();
    expect(r2.result).toBe('value 2');
    expect(meta.fn.mock.calls.length).toBe(2);
  });

  test.concurrent('Invalidate function works', async () => {
    const [meta, cachedFn] = prep<[1 | 2]>();

    await cachedFn(1);
    await cachedFn(2);
    expect(meta.fn.mock.calls.length).toBe(2);

    cachedFn.invalidate(1);
    await cachedFn(1);
    await cachedFn(2);
    expect(meta.fn.mock.calls.length).toBe(3);

    // Still returns stale result if the API goes down
    cachedFn.invalidate(1);
    meta.up = false;
    const r1 = await cachedFn(1);
    expect(r1.error).toBeUndefined();
    expect(r1.result).toEqual([1]);
    expect(meta.fn.mock.calls.length).toBe(4);

    // invalidate all entries at once
    meta.up = false;
    cachedFn.invalidate.all();
    await cachedFn(1);
    const r2 = await cachedFn(2);
    expect(r2.error).toBeUndefined();
    expect(r2.result).toEqual([2]);
    expect(meta.fn.mock.calls.length).toBe(6);

    // invalidating only entry with key `[2]`
    meta.up = false;
    cachedFn.invalidate.all((key) => key === '[2]');
    await cachedFn(1);
    expect(meta.fn.mock.calls.length).toBe(6);
    const r3 = await cachedFn(2);
    expect(r3.error).toBeUndefined();
    expect(r3.result).toEqual([2]);
    expect(meta.fn.mock.calls.length).toBe(7);
  });

  test.concurrent('Purge function works', async () => {
    const [meta, cachedFn] = prep<[1 | 2]>();

    await cachedFn(1);
    await cachedFn(2);
    expect(meta.fn.mock.calls.length).toBe(2);

    cachedFn.purge(1);
    await cachedFn(1);
    await cachedFn(2);
    expect(meta.fn.mock.calls.length).toBe(3);

    // Entry is deleted so it doesn't return stale result when API goes down
    cachedFn.purge(1);
    meta.up = false;
    const r1 = await cachedFn(1);
    expect(r1.error).toBeInstanceOf(Error);
    expect(r1.result).toBeUndefined();
    expect(meta.fn.mock.calls.length).toBe(4);

    // purge all entries at once
    meta.up = false;
    cachedFn.purge.all();
    await cachedFn(1);
    const r2 = await cachedFn(2);
    expect(r2.error).toBeInstanceOf(Error);
    expect(r2.result).toBeUndefined();
    expect(meta.fn.mock.calls.length).toBe(6);

    // purging only entry with key `[2]`
    meta.up = false;
    cachedFn.purge.all((key) => key === '[2]');
    await cachedFn(1);
    expect(meta.fn.mock.calls.length).toBe(6);
    const r3 = await cachedFn(2);
    expect(r3.error).toBeInstanceOf(Error);
    expect(r3.result).toBeUndefined();
    expect(meta.fn.mock.calls.length).toBe(7);
  });

  test.concurrent('accepts custom `cache` object', async () => {
    const cache = new Map<string, unknown>();
    const [meta, cachedFn] = prep<[number]>({ cache });

    await cachedFn(1);
    await cachedFn(2);
    expect(meta.fn.mock.calls.length).toBe(2);
    expect(cache.size).toBe(2);
  });

  test.concurrent('`unwrapResult` option works', async () => {
    const cachedFn = cachifyAsync({
      fn: async (x: number, throwErr?: true) =>
        throwErr ? Result.Fail('Argh!!!') : Result.Success(x),
      ttl: '30s',
      unwrapResult: true,
    });

    const r1 = await cachedFn(32);
    expect(r1).toEqual(32);
    const r2 = await cachedFn(17, true);
    expect(r2).toEqual(undefined);
  });
});
