import { EitherObj } from '@reykjavik/hanna-utils';

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
 * @see https://github.com/reykjavikcity/webtools/blob/v0.2/README.md#maxwait
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
 * @see https://github.com/reykjavikcity/webtools/blob/v0.2/README.md#promiseallobject
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
 * @see https://github.com/reykjavikcity/webtools/blob/v0.2/README.md#debounce
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
 * @see https://github.com/reykjavikcity/webtools/blob/v0.2/README.md#throttle
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
