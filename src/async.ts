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
    return Promise.race([
      sleep(timeout),
      Promise.allSettled(promises).then(() => undefined),
    ]);
  }
  return Promise.race([sleep(timeout), Promise.allSettled(Object.values(promises))]).then(
    () => {
      const retObj: Record<string, undefined | { value: unknown }> = {};
      Object.entries(promises).forEach(([key, value]) => {
        if (value instanceof Promise) {
          retObj[key] = undefined;
          value
            .then((value) => {
              retObj[key] = { value };
            })
            .catch(() => undefined);
        } else {
          retObj[key] = { value };
        }
      });
      return sleep(0).then(() => retObj);
    }
  );
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
