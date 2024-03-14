type PlainObj = Record<string, unknown>;

/**
 * Simple sleep function. Returns a promise that resolves after `length`
 * milliseconds.
 */
export const sleep = (length: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, length));

// ---------------------------------------------------------------------------

/**
 * Resolves soon as all of the passed `promises` have resolved, or after
 * `timeout` milliseconds — whichever comes first.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#maxwait
 */
export function maxWait(timeout: number, promises: Array<unknown>): Promise<void>;
export function maxWait<PromiseMap extends PlainObj>(
  timeout: number,
  promises: PromiseMap
): Promise<{
  -readonly [K in keyof PromiseMap]: { value: Awaited<PromiseMap[K]> } | undefined;
}>;

export function maxWait(timeout: number, promises: Array<unknown> | PlainObj) {
  if (Array.isArray(promises)) {
    return Promise.race([sleep(timeout), Promise.all(promises).then(() => undefined)]);
  }
  return Promise.race([sleep(timeout), Promise.all(Object.values(promises))]).then(() => {
    Object.entries(promises).forEach(([key, value]) => {
      if (value instanceof Promise) {
        promises[key] = undefined;
        value.then((value) => {
          promises[key] = { value };
        });
      } else {
        promises[key] = { value };
      }
    });
    return sleep(0).then(
      () =>
        promises as {
          -readonly [K in keyof typeof promises]:
            | Awaited<(typeof promises)[K]>
            | undefined;
        }
    );
  });
}

// ---------------------------------------------------------------------------

// Adapted from https://github.com/marcelowa/promise-all-properties
/**
 * A variation of `Promise.all()` that accepts an object with named promises
 * and returns a same-shaped object with the resolved values.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#promiseallobject
 */
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
