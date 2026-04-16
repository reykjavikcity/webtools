import { EitherObj } from '@reykjavik/hanna-utils';

import { Result } from './errorhandling.js';
import { toSec as _toSec, TTL } from './http.js';

type PlainObj = Record<string, unknown>;

/**
 * Simple sleep function. Returns a promise that resolves after `length`
 * milliseconds.
 */
/*#__NO_SIDE_EFFECTS__*/
export const sleep = (length: number, opts?: { signal?: AbortSignal }) =>
  new Promise<void>((resolve, reject) => {
    const signal = opts && opts.signal;
    if (!signal) {
      return setTimeout(resolve, length);
    }
    if (signal.aborted) {
      return reject(signal.reason);
    }
    const onAbort = () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(signal.reason);
    };
    signal.addEventListener('abort', onAbort);

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, length);
  });

/**
 * Returns a function that adds lag/delay to a promise chain,
 * passing the promise payload through.
 */
/*#__NO_SIDE_EFFECTS__*/
export const addLag =
  (length: number, opts?: { signal?: AbortSignal }) =>
  <T>(res: T) =>
    sleep(length, opts).then(() => res);

// ---------------------------------------------------------------------------

/**
 * Resolves as soon as all of the passed `promises` have resolved/settled,
 * or after `timeout` milliseconds — whichever comes first.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#maxwait
 */
export function maxWait(timeout: number, promises: Array<unknown>): Promise<void>;
export function maxWait<PromiseMap extends PlainObj>(
  timeout: number,
  promises: PromiseMap
): Promise<{
  -readonly [K in keyof PromiseMap]:
    | EitherObj<PromiseFulfilledResult<Awaited<PromiseMap[K]>>, PromiseRejectedResult>
    | undefined;
}>;

/*#__NO_SIDE_EFFECTS__*/
export function maxWait(timeout: number, promises: Array<unknown> | PlainObj) {
  if (Array.isArray(promises)) {
    return Promise.race([
      sleep(timeout),
      Promise.allSettled(promises).then(() => undefined),
    ]);
  }
  return Promise.race([sleep(timeout), Promise.allSettled(Object.values(promises))]).then(
    () => {
      const retObj: Record<string, undefined | PromiseSettledResult<unknown>> = {};
      Object.entries(promises).forEach(([key, value]) => {
        if (value instanceof Promise) {
          retObj[key] = undefined;
          value.then(
            (value) => {
              retObj[key] = { status: 'fulfilled', value };
            },
            (reason) => {
              retObj[key] = { status: 'rejected', reason };
            }
          );
        } else {
          retObj[key] = { status: 'fulfilled', value };
        }
      });
      return Promise.resolve().then(() => ({ ...retObj }));
    }
  );
}

// ---------------------------------------------------------------------------

// Adapted from https://github.com/marcelowa/promise-all-properties
/**
 * A variation of `Promise.all()` that accepts an object with named promises
 * and returns a same-shaped object with the resolved values.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#promiseallobject
 */
/*#__NO_SIDE_EFFECTS__*/
export const promiseAllObject = <T extends PlainObj>(promisesMap: T) =>
  Promise.all(Object.values(promisesMap)).then((results) => {
    const keys = Object.keys(promisesMap);
    const resolvedMap: PlainObj = {};
    for (let i = 0; i < results.length; i++) {
      resolvedMap[keys[i]!] = results[i];
    }
    return resolvedMap as {
      -readonly [K in keyof T]: Awaited<T[K]>;
    };
  });

// ---------------------------------------------------------------------------

type TimerId = ReturnType<typeof setTimeout>; // Ack this sidesteps that window.setTimeout and Node's setTimeout return different types

type Cancellable<A extends Array<unknown>> = ((...args: A) => void) & {
  /**
   * Cancels any pending invocation of the debounced function.  \
   * If `finish` is true and if a debounce is pending, the function is invoked
   * before cancelling.
   */
  cancel(finish?: boolean): void;
};

/**
 * Returns a debounced function that only runs after `delay` milliseconds
 * of quiet-time.  \
 * The returned function also has a nice `.cancel()` method.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#debounce
 */
/*#__NO_SIDE_EFFECTS__*/
export const debounce = <A extends Array<unknown>>(
  /** The function to debounce */
  func: (...args: A) => void,
  /** The delay, in milliseconds, to wait before running the function */
  delay: number,
  /** Whether to run the function at the start of the delay instead of the end */
  immediate?: boolean
): Cancellable<A> => {
  let timeout: TimerId | undefined;
  let _args: A;
  let _this: unknown;

  const debouncedFn: Cancellable<A> = function (this: unknown, ...args) {
    _args = args;
    _this = this;

    immediate && !timeout && func.apply(_this, _args);

    timeout && clearTimeout(timeout);
    timeout = setTimeout(() => {
      debouncedFn.cancel(true);
    }, delay);
  };

  debouncedFn.cancel = (finish) => {
    timeout && clearTimeout(timeout);
    finish && timeout && func.apply(_this, _args);
    timeout = undefined;
  };

  return debouncedFn;
};

/**
 * Sugar to produce a dynamic debounced function that accepts its contents/behavior at call time.
 *
 * Usage:
 * ```ts
 *      const myDebouncer = debounce.d(500);
 *      myDebouncer(() => { alert('Hello world'); });
 *      myDebouncer(() => { alert('I mean: Howdy world!'); });
 *      myDebouncer((name) => { alert('Wazzap ' + name); }, 'world');
 * ```
 *
 * Not documented in README as its usefulness is still uncertain.
 */
debounce.d = (delay: number, immediate?: boolean) =>
  debounce(
    function <Fn extends (...args: Array<any>) => void>(
      this: unknown,
      fn: Fn,
      ...args: Parameters<Fn>
    ) {
      fn.apply(this, args);
    },
    delay,
    immediate
  );

// ---------------------------------------------------------------------------

type Finishable<A extends Array<unknown>> = ((...args: A) => void) & {
  /**
   * Immediately invokes the function if there is a pending throttle and its last
   * invoication was throttled (cancelled).  \
   * If `cancel` is true then only the timer is reset without invoking function.
   */
  finish(cancel?: boolean): void;
};

/**
 * Returns a throttled function that never runs more often than
 * every `delay` milliseconds.  \
 * The returned function also has a nice `.finish()` method to reset the
 * throttle timer
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#throttle
 */
/*#__NO_SIDE_EFFECTS__*/
export const throttle = <A extends Array<unknown>>(
  /** The function to throttle */
  func: (...args: A) => void,
  /** The delay, in milliseconds, to wait between invocations */
  delay: number,
  /** Whether to skip the first invocation instead of running it immediately */
  skipFirst?: boolean
): Finishable<A> => {
  let timeout: TimerId | undefined;
  let throttled = 0;
  let _args: A;
  let _this: unknown;

  const throttledFn: Finishable<A> = function (this: unknown, ...args) {
    _args = args;
    _this = this;

    if (!throttled) {
      skipFirst ? throttled++ : func.apply(_this, _args);
      timeout = setTimeout(throttledFn.finish, delay) as unknown as TimerId; // Go home TypeScript, you're drunk!
    }

    throttled++;
  };

  throttledFn.finish = (cancel?: boolean) => {
    timeout && clearTimeout(timeout);
    !cancel && throttled && func.apply(_this, _args);
    throttled = 0;
  };

  return throttledFn;
};

/**
 * Sugar to produce a dynamic debounced function that accepts its contents/behavior at call time.
 *
 * Usage:
 * ```ts
 *      const myThrottler = throttle.d(500);
 *      myThrottler(() => { alert('Hello world'); });
 *      myThrottler(() => { alert('I mean: Howdy world!'); });
 *      myThrottler((name) => { alert('Wazzap ' + name); }, 'world');
 * ```
 *
 * Not documented in README as its usefulness is still uncertain.
 */
throttle.d = (delay: number, skipFirst?: boolean) =>
  throttle(
    function <Fn extends (...args: Array<any>) => void>(
      this: unknown,
      fn: Fn,
      ...args: Parameters<Fn>
    ) {
      fn.apply(this, args);
    },
    delay,
    skipFirst
  );

// ---------------------------------------------------------------------------

// Wrap toSec to use a 90% shorter TTL in development mode
const toSec =
  process.env.NODE_ENV === 'production' ? _toSec : (val: TTL) => _toSec(val) / 10;

const DEFAULT_THROTTLING_MS: TTL = '30s';

/**
 * Wraps an async function with a simple, but fairly robust caching layer.
 *
 * Successful results are cached for `ttlMs`, while error results are
 * throttled to avoid hammering the underlying function.
 *
 * It has no max size or eviction strategy and is only intended for caching
 * a small, clearly bounded number of different cache "keys"
 * (e.g. one result per language).
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#cachifyasync
 */
/*#__NO_SIDE_EFFECTS__*/
export const cachifyAsync = <
  R,
  F extends (...args: Array<any>) => Promise<Result.TupleObj<R>>
>(opts: {
  /** The async function to cache. */
  fn: F;

  /**
   * How long to cache successful results.
   *
   * Number values are rounded and treated as seconds.
   */
  ttl: TTL;

  /**
   * The minimum time between retries for error results, to avoid hammering
   * the underlying function while waiting for the issue to be (hopefully)
   * resolved.
   *
   * Raw numbers are rounded and treated as seconds.
   *
   *  Default: '30s'
   */
  throttle?: TTL;

  /**
   * Function to optionally set a custom TTL on success and/or error results,
   * when the promise resolves.
   *
   * If `undefined` is returned, the default `ttl` and` `throttle` settings
   * are used.
   */
  customTtl?: (args: Parameters<F>, result: Result.TupleObj<R>) => TTL | undefined;

  /**
   * Creates a custom cache key for the current result set.
   *
   * Default: `JSON.stringify()` of the arguments passed to the cached function
   */
  getKey?: (...args: Parameters<F>) => string;

  /**
   * Whether to return stale (last successful) result when `fn` resolves to an
   * error result.
   *
   * Default: `true`
   */
  returnStale?: boolean;
}): F => {
  const { fn, getKey = (...args) => JSON.stringify(args), customTtl, returnStale } = opts;

  // Set up the cache object
  const TTL_SEC = toSec(opts.ttl);
  const THROTTLING_SEC =
    toSec(opts.throttle || 0) || Math.min(toSec(DEFAULT_THROTTLING_MS), TTL_SEC);

  const _cache = new Map<
    string,
    { data: Promise<Result.TupleObj<R>>; freshUntil: number }
  >();

  return (async (...args: Parameters<F>) => {
    const now = Date.now();
    const key = getKey(...args);
    const cached = _cache.get(key);
    if (cached && now < cached.freshUntil) {
      return cached.data;
    }

    const lastData = returnStale !== false && cached?.data;
    const entry = {
      // Set an initial "fresh until" that's longer than TTL_SEC to cover
      // (somewhat) safely the time it takes for the promise to resolve,
      // so that we don't trigger multiple calls to `fn` in parallel
      // TODO: Build in a proper AbortSignal timeout, etc. to handle this more robustly
      freshUntil: now + (TTL_SEC + 60) * 1_000,
      data: fn(...args).then((result) => {
        const customTtlSec = toSec(customTtl?.(args, result) || 0);
        entry.freshUntil = now + (customTtlSec || TTL_SEC) * 1_000;

        if (result.error) {
          if (!customTtlSec) {
            // Set shorter TTL on errors to allow quicker retries
            entry.freshUntil = now + THROTTLING_SEC * 1_000;
          }
          if (lastData) {
            // Return last known good data if available, even if it's a bit stale
            return lastData;
          }
        }
        return result;
      }),
    };
    _cache.set(key, entry);

    return entry.data;
  }) as F;
};
