/**
 * Error subclass for thrown values that got cought and turned into an actual
 * Error, with the thrown value as the `payload` property.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#aserror
 */
export class ErrorFromPayload extends Error {
  payload?: unknown;

  constructor(payload: unknown) {
    if (process.env.NODE_ENV !== 'production' && payload instanceof Error) {
      throw new Error('Do not pass an Error instance as payload, just use it directly');
    }
    const message =
      (payload != null ? String(payload) : '') || 'Threw a falsy/empty value';
    super(message);
    this.payload = payload;
  }

  name = 'ErrorFromPayload';
}

/**v
 * Guarantees that a caught (`catch (e)`) value of `unknown` type,
 * is indeed an `Error` instance.
 *
 *If the input is an `Error` instance, it is returned as-is. If the input is
 * something else it is wrapped in a new `ErrorFromPayload` instance, and the
 * original value is stored in a `payload`
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#aserror
 */
export const asError = (maybeError: unknown): ErrorFromPayload => {
  if (maybeError instanceof Error) {
    return maybeError;
  }
  return new ErrorFromPayload(maybeError);
};

// ---------------------------------------------------------------------------

type SuccessResult<T> = [error: undefined, result: T] & {
  error?: undefined;
  result: T;
};
type FailResult<E extends Error> = [error: E] & {
  error: E;
  result?: undefined;
};

/**
 * Simple bare-bones discriminated tuple type for a [error, result] pair.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#type-resulttuple
 */
export type ResultTuple<T, E extends Error = Error> =
  | [error: undefined, result: T]
  | [error: E];

/**
 * Discriminated tuple type for a `[error, result]` pair (same as `ResultTuple`)
 * but with named properties `error` and `result` attached for dev convenience.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#type-resulttupleobj
 */
export type ResultTupleObj<T, E extends Error = Error> = SuccessResult<T> | FailResult<E>;

const Success = <T>(result: T) => {
  const tuple = [undefined, result] as SuccessResult<T>;
  tuple.result = result;
  return tuple;
};
const Fail = <E extends Error = Error>(e: unknown) => {
  const tuple = [asError(e) as E] as FailResult<E>;
  tuple.error = tuple[0];
  return tuple;
};

/**
 * Error handling utility that wraps a promise or a callback function.
 *
 * Catches errors and returns a `ResultTupleObj` — a nice discriminated
 * `[error, results]` tuple with the `result` and `error` also attached as
 * named properties.
 *
 * Works on both promises and sync callback functions.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#resultcatch
 */
function catch_<T, E extends Error = ErrorFromPayload>(
  promise: Promise<T>
): Promise<ResultTupleObj<T, E>>;
function catch_<T, E extends Error = ErrorFromPayload>(
  callback: () => T
): ResultTupleObj<T, E>;

function catch_<T, E extends Error = ErrorFromPayload>(
  something: Promise<T> | (() => T)
): ResultTupleObj<T, E> | Promise<ResultTupleObj<T, E>> {
  if (something instanceof Promise) {
    return something.then(
      (result) => Success(result),
      (e) => Fail<E>(e)
    );
  }
  try {
    return Success(something());
  } catch (e) {
    return Fail<E>(e);
  }
}

/**
 * Singleton object with small methods for creating, mapping or handling
 * `ResultTupleObj` instances.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#result-singleton
 */
export const Result = {
  /**
   * Factory for creating a successful `Result.TupleObj`.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#resultsuccess
   */
  Success,

  /**
   * Factory for creating a failed `Result.TupleObj`.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#resultsfail
   */
  Fail,

  // NOTE: The JSDoc must be placed above the `catch_` function above.
  catch: catch_,

  /**
   * Helper to map a `ResultTuple`-like object to a new `ResultTupleObj`
   * object, applying a transformation function to the result, but retaining
   * the error as-is.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#resulmap
   */
  map: <T, T2, E extends Error>(
    result: ResultTuple<T, E>,
    mapFn: (resultValue: T) => T2
  ): ResultTupleObj<T2, E> => {
    const [error, resultValue] = result;
    if (error) {
      return Fail<E>(error);
    }
    return Success(mapFn(resultValue as T));
  },

  /**
   * Unwraps a discriminated [error, result] `Result.Tuple`-like object
   * and throws if there's an error, but returns the result otherwise.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#resulthrow
   */
  throw: <T>(result: ResultTuple<T>): T => {
    if (result[0]) {
      throw result[0];
    }
    return result[1];
  },
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Result {
  export type Tuple<T, E extends Error = Error> = ResultTuple<T, E>;
  export type TupleObj<T, E extends Error = Error> = ResultTupleObj<T, E>;
  export type SuccessObj<T> = SuccessResult<T>;
  export type FailObj<E extends Error> = FailResult<E>;
}
