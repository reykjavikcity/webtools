import { useEffect, useMemo, useRef } from 'react';

import { debounce, throttle } from './async.js';

/**
 * Returns a stable debounced function that invokes the supplied function
 * after the specified delay.  \
 * When the component unmounts, any pending (debounced) calls are automatically cancelled.
 *
 * **NOTE:** The supplied callback does not need to be memoized. The debouncer
 * will always invoke the last supplied version.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.2/README.md#usedebounced
 */
export const useDebounced = <A extends Array<unknown>>(
  /** The function to debounce */
  func: (...args: A) => void,
  /** The delay, in milliseconds, to wait before running the function */
  delay: number,
  /** Whether to run the function at the start of the delay instead of the end */
  immediate?: boolean
) => {
  const fn = useRef<typeof func>();
  fn.current = func;

  const debouncedFunc = useMemo(
    () =>
      debounce(
        (...args: Parameters<typeof func>) => fn.current!(...args),
        delay,
        immediate
      ),
    [delay, immediate]
  );
  useEffect(() => debouncedFunc.cancel, [debouncedFunc]);
  return debouncedFunc;
};

/**
 * Returns a stable throttler function that throttles the supplied function.
 *
 * **NOTE:** The supplied callback does not need to be memoized. The throttler
 * will always invoke the last supplied version.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.2/README.md#usethrottled
 */
export const useThrottled = <A extends Array<unknown>>(
  /** The function to throttle */
  func: (...args: A) => void,
  /** The delay, in milliseconds, to wait between invocations. */
  delay: number,
  /** Whether to skip the first invocation instead of running it immediately. */
  skipFirst?: boolean
) => {
  const fn = useRef<typeof func>();
  fn.current = func;

  const throttledFunc = useMemo(
    () =>
      throttle(
        (...args: Parameters<typeof func>) => fn.current!(...args),
        delay,
        skipFirst
      ),
    [delay, skipFirst]
  );
  // NOTE: We don't need to run throttled.finish() on unmount, as the default behavior is no-op.
  return throttledFunc;
};
