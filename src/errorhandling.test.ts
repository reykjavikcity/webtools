import { Equals, Expect } from '@maranomynet/libtools';
import { describe, expect, test } from 'bun:test';

import type { ResultTuple, ResultTupleObj } from './errorhandling.js';
import { asError, ErrorFromPayload, Result } from './errorhandling.js';
import * as moduleExports from './errorhandling.js';

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */

  // ---------------------------------------------------------------------------
  // Test exports

  const exports: Record<keyof typeof moduleExports, true> = {
    asError: true,
    ErrorFromPayload: true,
    Result: true,
  };

  type ResultTuple_is_exported = ResultTuple<undefined>;
  type ResultTupleObj_is_exported = ResultTupleObj<undefined>;
  type Result_Tuple_is_exported = Result.Tuple<undefined>;
  type Result_TupleObj_is_exported = Result.TupleObj<undefined>;
  type Result_SuccessObj_is_exported = Result.SuccessObj<undefined>;
  type Result_FailObj_is_exported = Result.FailObj<Error>;

  type assertions = [
    Expect<Equals<ResultTuple<unknown>, Result.Tuple<unknown>>>,
    Expect<Equals<ResultTupleObj<unknown>, Result.TupleObj<unknown>>>,
    Expect<
      Equals<Result.TupleObj<unknown>, Result.SuccessObj<unknown> | Result.FailObj<Error>>
    >
  ];

  // ---------------------------------------------------------------------------
  // Test types

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// ---------------------------------------------------------------------------
// Test ErrorFromPayload

describe('ErrorFromPayload', () => {
  test('should create a extended Error instance with a payload property', () => {
    const payload = 'test payload';
    const error = new ErrorFromPayload(payload);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ErrorFromPayload');
    expect(error.message).toBe('test payload');
    expect(error.payload).toBe(payload);
  });

  test('should throw an error if payload is an Error instance in outside production', () => {
    if (process.env.NODE_ENV !== 'production') {
      expect(() => new ErrorFromPayload(new Error('test error'))).toThrow();
    }
  });

  test('should stringify the payload if it is not a string', () => {
    const payloadArr = ['test', 'payload'];
    expect(asError(payloadArr).message).toBe(String(payloadArr));
    // No fancy stringification for objects
    const payloadObj = { test: 'payload' };
    expect(asError(payloadObj).message).toBe(String(payloadObj)); // '[object Object]'
    const payloadRegExp = /./g;
    expect(asError(payloadRegExp).message).toBe(String(payloadRegExp));
    const payloadNumber = Infinity;
    expect(asError(payloadNumber).message).toBe(String(payloadNumber));
    const payloadBoolean = true;
    expect(asError(payloadBoolean).message).toBe(String(payloadBoolean));
  });

  test('should handle falsy payloads in a predictable manner', () => {
    const err_undef = new ErrorFromPayload(undefined);
    const emptyMessage = 'Threw a falsy/empty value';
    expect(err_undef.message).toBe(emptyMessage);
    expect(err_undef.payload).toBeUndefined();
    const err_null = new ErrorFromPayload(null);
    expect(err_null.message).toBe(emptyMessage);
    expect(err_null.payload).toBeNull();
    const err_emptyStr = new ErrorFromPayload('');
    expect(err_emptyStr.message).toBe(emptyMessage);
    expect(err_emptyStr.payload).toBe('');
    // false, 0 and NaN are just stringified
    const err_false = new ErrorFromPayload(false);
    expect(err_false.message).toBe('false');
    expect(err_false.payload).toBe(false);
    const err_0 = new ErrorFromPayload(0);
    expect(err_0.message).toBe('0');
    expect(err_0.payload).toBe(0);
    const err_NaN = new ErrorFromPayload(parseInt('foo'));
    expect(err_NaN.message).toBe('NaN');
    expect(err_NaN.payload).toBeNaN();
  });
});

// ---------------------------------------------------------------------------
// Test asError

describe('asError', () => {
  test('should return the input error as-is, if it is an Error instance', () => {
    const error = new Error('test error');
    expect(asError(error)).toBe(error);
    const errorSubtype = new ErrorFromPayload('test type error');
    expect(asError(errorSubtype)).toBe(errorSubtype);
  });

  test('should return an ErrorFromPayload if input is not an Error instance', () => {
    const payload = ['test', 'payload'];
    const error = asError(payload);
    expect(error).toBeInstanceOf(ErrorFromPayload);
    expect(error.payload).toBe(payload);
  });
});

// ---------------------------------------------------------------------------
// Test Result

describe('Result', () => {
  test('singleton contains correct keys', () => {
    expect(Object.keys(Result)).toEqual(['Success', 'Fail', 'catch', 'map', 'throw']);
  });
});

describe('Result.Success / Result.Fail', () => {
  test('`Success` creates a success tuple', () => {
    const result = { prop: 'test result' };
    const success: ResultTupleObj<typeof result> = Result.Success(result);
    expect(success[0]).toBeUndefined();
    expect(success.error).toBeUndefined();
    expect(success[1]).toBe(result);
    expect(success.result).toBe(result);
  });

  test('`Fail` creates a fail tuple', () => {
    const error = new Error('test error');
    const fail: ResultTupleObj<unknown> = Result.Fail(error);
    expect(fail[0]).toEqual(error);
    expect(fail.error).toBe(error);
    expect(fail[1]).toBeUndefined();
    expect(fail.result).toBeUndefined();
  });
});

describe('Result.catch', () => {
  test('handles promises', async () => {
    const [error, result] = await Result.catch(Promise.resolve('test result'));
    expect(error).toBeUndefined();
    expect(result).toBe('test result');
  });

  test('handles promise rejections', async () => {
    const [error, result] = await Result.catch(Promise.reject('test error'));
    expect(error).toBeInstanceOf(ErrorFromPayload);
    expect(error?.payload).toBe('test error');
    expect(result).toBeUndefined();
  });

  test('handles synchronous callback functions', () => {
    const callback = () => 'test result';
    const [error, result] = Result.catch(callback);
    expect(error).toBeUndefined();
    expect(result).toBe('test result');
  });

  test('handles synchronous callback function errors', () => {
    const callback = () => {
      throw 'test error'; // eslint-disable-line no-throw-literal
    };
    const [error, result] = Result.catch(callback);
    expect(error).toBeInstanceOf(ErrorFromPayload);
    expect(error?.payload).toBe('test error');
    expect(result).toBeUndefined();
  });
});

describe('Result.map', () => {
  test('transforms a result', () => {
    const result = Result.Success('test result');
    const mapped = Result.map(result, (res) => res.toUpperCase());
    expect(mapped.result).toBe('TEST RESULT');
  });
});

describe('Result.throw', () => {
  test('returns result if no error', () => {
    const result: ResultTupleObj<string> = Result.Success('test result');
    expect(Result.throw(result)).toBe(result.result);
  });

  test('throws error if present', () => {
    const result: ResultTupleObj<unknown> = Result.Fail(new Error('test error'));
    expect(() => Result.throw(result)).toThrow(result.error);
  });
});
