/**
 * Error subclass for thrown NON-Error values that got turned into an actual
 * Error, with the original thrown value as the `payload` property.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#aserror
 */
/*#__NO_SIDE_EFFECTS__*/
export class ErrorFromPayload extends Error {
  /**
   * This payload property is only set if the original `throw` value was NOT
   * `instanceof Error`.
   *
   * In such cases it contains the thrown value as is, and the `message`
   * property of this `ErrorFromPayload` instance is set to the `.toString()`
   * representation of the payload.
   */
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
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#aserror
 */
/*#__NO_SIDE_EFFECTS__*/
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
  mapTo: <T2, E extends Error = Error>(fn: (result: T) => T2) => ResultTupleObj<T2, E>;
};
type FailResult<E extends Error> = [error: E, result?: undefined] & {
  error: E;
  result?: undefined;
  mapTo: () => FailResult<E>;
};

/**
 * Simple bare-bones discriminated tuple type for a [error, result] pair.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#type-resulttuple
 */
export type ResultTuple<T, E extends Error = Error> =
  | [error: undefined, result: T]
  | [error: E, result?: undefined];

/**
 * Discriminated tuple type for a `[error, result]` pair (same as `ResultTuple`)
 * but with named properties `error` and `result` attached for dev convenience.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#type-resulttupleobj
 */
export type ResultTupleObj<T, E extends Error = Error> = SuccessResult<T> | FailResult<E>;

/*#__NO_SIDE_EFFECTS__*/
const Success = <T>(result: T) => {
  const tuple = [undefined, result] as SuccessResult<T>;
  tuple.result = result;
  tuple.mapTo = <T2, E extends Error = Error>(fn: (result: T) => T2) =>
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    map<T, T2, E>(tuple, fn);
  return tuple;
};

function Fail<E extends Error = Error>(e: E): FailResult<E>;
function Fail<E extends Error = Error>(e: unknown): FailResult<E>;
/*#__NO_SIDE_EFFECTS__*/
function Fail<E extends Error = Error>(e: unknown) {
  const tuple = [asError(e) as E] as FailResult<E>;
  tuple.error = tuple[0];
  tuple.mapTo = () => tuple;
  return tuple;
}

/**
 * Error handling utility that wraps a promise or a callback function.
 *
 * Catches errors and returns a `ResultTupleObj` — a nice discriminated
 * `[error, results]` tuple with the `result` and `error` also attached as
 * named properties.
 *
 * Works on both promises and (synchronous) callback functions.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#resultcatch
 */
function catch_<T, E extends Error = ErrorFromPayload>(
  promise: Promise<T>
): Promise<ResultTupleObj<T, E>>;
function catch_<T, E extends Error = ErrorFromPayload>(
  callback: () => T
): ResultTupleObj<T, E>;

/*#__NO_SIDE_EFFECTS__*/
function catch_<T, E extends Error = ErrorFromPayload>(
  something: Promise<T> | (() => T)
): ResultTupleObj<T, E> | Promise<ResultTupleObj<T, E>> {
  if (something instanceof Promise) {
    return something.then(Success, (e) => Fail<E>(e));
  }
  try {
    return Success(something());
  } catch (e) {
    return Fail<E>(e);
  }
}

const map = <T, T2, E extends Error>(
  result: ResultTuple<T, E>,
  /*#__NO_SIDE_EFFECTS__*/
  mapFn: (resultValue: T) => T2
): ResultTupleObj<T2, E> => {
  const [error, resultValue] = result;
  if (error) {
    return Fail<E>(error);
  }
  return catch_(() => mapFn(resultValue as T));
};

/**
 * Singleton object with small methods for creating, mapping or handling
 * `ResultTupleObj` instances.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#result-singleton
 */
export const Result = {
  /**
   * Factory for creating a successful `Result.TupleObj`.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#resultsuccess
   */
  Success,

  /**
   * Factory for creating a failed `Result.TupleObj`.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#resultsfail
   */
  Fail,

  // NOTE: The JSDoc must be placed above the `catch_` function above.
  catch: catch_,

  ify: catch_,

  /**
   * Helper to map a `ResultTuple`-like object to a new `ResultTupleObj`
   * object, applying a transformation function to the result, but retaining
   * the error as-is.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#resulmap
   */
  /*#__NO_SIDE_EFFECTS__*/
  map: <T, T2, E extends Error>(
    result: ResultTuple<T, E>,
    mapFn: (resultValue: T) => T2
  ): ResultTupleObj<T2, E> => {
    const [error, resultValue] = result;
    if (error) {
      return Fail<E>(error);
    }
    return catch_(() => mapFn(resultValue as T));
  },

  /**
   * Unwraps a discriminated [error, result] `Result.Tuple`-like object
   * and throws if there's an error, but returns the result otherwise.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#resulthrow
   */
  /*#__NO_SIDE_EFFECTS__*/
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
  /**
   * Extracts the successful payload type `T` from a `Result.Tuple<T>`-like
   * type, a `Promise` of such type, or a function returning either of those.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#type-resultpayloadof
   */
  export type PayloadOf<
    T extends
      | ResultTuple<unknown>
      | Promise<ResultTuple<unknown>>
      | ((...args: Array<any>) => ResultTuple<unknown> | Promise<ResultTuple<unknown>>)
  > = T extends
    | [undefined, infer P]
    | Promise<ResultTuple<infer P>>
    | ((...args: Array<any>) => ResultTuple<infer P> | Promise<ResultTuple<infer P>>)
    ? P
    : never;

  /**
   * Extracts the error type `E` from a `Result.Tuple<T, E>`-like
   * type, a `Promise` of such type, or a function returning either of those.
   *
   * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#type-resultpayloadof
   */
  export type ErrorOf<
    T extends
      | ResultTuple<unknown>
      | Promise<ResultTuple<unknown>>
      | ((...args: Array<any>) => ResultTuple<unknown> | Promise<ResultTuple<unknown>>)
  > = T extends [infer E, undefined?]
    ? E
    : T extends Promise<infer P>
    ? P extends [infer E, undefined?]
      ? E
      : never
    : T extends (...args: Array<any>) => infer R
    ? R extends [infer E, undefined?]
      ? E
      : R extends Promise<infer P>
      ? P extends [infer E, undefined?]
        ? E
        : never
      : never
    : never;
}

/** /
// ---------------------------------------------------------------------------
// Tests for the Result.ErrorOf type helper:
// Should all extract the `X_Error` type as the error type from the various `Result.Tuple`-like types below:
let _e1: Result.ErrorOf<Result.Tuple<P, X_Error>>;
//  ^?
let _e2: Result.ErrorOf<Result.TupleObj<P, X_Error>>;
//  ^?
let _e3: Result.ErrorOf<ResultTupleObj<P, X_Error>>;
//  ^?
let _e4: Result.ErrorOf<ResultTuple<P, X_Error>>;
//  ^?

let _e5: Result.ErrorOf<Promise<Result.Tuple<P, X_Error>>>;
//  ^?
let _e6: Result.ErrorOf<Promise<Result.TupleObj<P, X_Error>>>;
//  ^?
let _e7: Result.ErrorOf<Promise<ResultTuple<P, X_Error>>>;
//  ^?
let _e8: Result.ErrorOf<Promise<ResultTupleObj<P, X_Error>>>;
//  ^?

let _E1: Result.ErrorOf<() => Result.Tuple<P, X_Error>>;
//  ^?
let _E2: Result.ErrorOf<() => Result.TupleObj<P, X_Error>>;
//  ^?
let _E3: Result.ErrorOf<() => ResultTupleObj<P, X_Error>>;
//  ^?
let _E3b: Result.ErrorOf<(a: null) => ResultTupleObj<P, X_Error>>;
//  ^?
let _E4: Result.ErrorOf<() => ResultTuple<P, X_Error>>;
//  ^?

let _E5: Result.ErrorOf<() => Promise<Result.Tuple<P, X_Error>>>;
//  ^?
let _E6: Result.ErrorOf<() => Promise<Result.TupleObj<P, X_Error>>>;
//  ^?
let _E7: Result.ErrorOf<() => Promise<ResultTuple<P, X_Error>>>;
//  ^?
let _E8: Result.ErrorOf<() => Promise<ResultTupleObj<P, X_Error>>>;
//  ^?

type P = string;
class X_Error extends Error {
  skilabod = 'fooo';
  constructor() {
    super('FormData validation error');
  }
}
/**/
