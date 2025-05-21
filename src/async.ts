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

type XX = EitherObj<PromiseFulfilledResult<string>, PromiseRejectedResult>;

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
