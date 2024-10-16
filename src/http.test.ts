import { describe, expect, spyOn, test } from 'bun:test';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';

import type {
  HTTP_BANNED,
  HTTP_CLIENT_ERROR,
  HTTP_CLIENT_ERROR_ALL,
  HTTP_ERROR,
  HTTP_ERROR_ALL,
  HTTP_INFO,
  HTTP_INFO_ALL,
  HTTP_NOT_FOUND,
  HTTP_NOTMODIFIED,
  HTTP_REDIRECTION,
  HTTP_REDIRECTION_ALL,
  HTTP_SERVER_ERROR,
  HTTP_SERVER_ERROR_ALL,
  HTTP_STATUS,
  HTTP_SUCCESS,
  HTTP_SUCCESS_ALL,
  TTL,
  TTLConfig,
} from './http.js';
import { cacheControl, cacheControlHeaders, toMs, toSec } from './http.js';
import * as moduleExports from './http.js';

// ---------------------------------------------------------------------------
// Test exports

if (false as boolean) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const exports: Record<keyof typeof moduleExports, true> = {
    toSec: true,
    toMs: true,
    cacheControl: true,
    cacheControlHeaders: true,

    HTTP_100_Continue: true,
    HTTP_101_SwitchingProtocols: true,
    HTTP_102_Processing: true,
    HTTP_103_EarlyHints: true,

    HTTP_200_OK: true,
    HTTP_201_Created: true,
    HTTP_202_Accepted: true,
    HTTP_203_NonAuthoritativeInformation: true,
    HTTP_204_NoContent: true,
    HTTP_205_ResetContent: true,
    HTTP_206_PartialContent: true,
    HTTP_207_MultiStatus: true,
    HTTP_208_AlreadyReported: true,
    HTTP_226_IMUsed: true,

    HTTP_301_MovedPermanently: true,
    HTTP_302_Found: true,
    HTTP_303_SeeOther: true,
    HTTP_304_NotModified: true,
    HTTP_307_TemporaryRedirect: true,
    HTTP_308_PermanentRedirect: true,

    HTTP_400_BadRequest: true,
    HTTP_401_Unauthorized: true,
    HTTP_403_Forbidden: true,
    HTTP_404_NotFound: true,
    HTTP_405_MethodNotAllowed: true,
    HTTP_406_NotAcceptable: true,
    HTTP_407_ProxyAuthenticationRequired: true,
    HTTP_408_RequestTimeout: true,
    HTTP_409_Conflict: true,
    HTTP_410_Gone: true,
    HTTP_411_LengthRequired: true,
    HTTP_412_PreconditionFailed: true,
    HTTP_413_PayloadTooLarge: true,
    HTTP_414_URITooLong: true,
    HTTP_415_UnsupportedMediaType: true,
    HTTP_416_RangeNotSatisfiable: true,
    HTTP_417_ExpectationFailed: true,
    HTTP_418_ImATeapot: true,
    HTTP_421_MisdirectedRequest: true,
    HTTP_422_UnprocessableContent: true,
    HTTP_423_Locked: true,
    HTTP_424_FailedDependency: true,
    HTTP_426_UpgradeRequired: true,
    HTTP_428_PreconditionRequired: true,
    HTTP_429_TooManyRequests: true,
    HTTP_431_RequestHeaderFieldsTooLarge: true,
    HTTP_451_UnavailableForLegalReasons: true,

    HTTP_500_InternalServerError: true,
    HTTP_501_NotImplemented: true,
    HTTP_502_BadGateway: true,
    HTTP_503_ServiceUnavailable: true,
    HTTP_504_GatewayTimeout: true,
    HTTP_505_HTTPVersionNotSupported: true,
    HTTP_506_VariantAlsoNegotiates: true,
    HTTP_507_InsufficientStorage: true,
    HTTP_508_LoopDetected: true,
    HTTP_510_NotExtended: true,
    HTTP_511_NetworkAuthenticationRequired: true,
  };

  type TTL_is_exported = TTL;
  type TTLConfig_is_exported = TTLConfig;
  type HTTP_STATUS_is_exported = HTTP_STATUS;
  type HTTP_INFO_is_exported = HTTP_INFO;
  type HTTP_SUCCESS_is_exported = HTTP_SUCCESS;
  type HTTP_REDIRECTION_is_exported = HTTP_REDIRECTION;
  type HTTP_NOTMODIFIED_is_exported = HTTP_NOTMODIFIED;
  type HTTP_ERROR_is_exported = HTTP_ERROR;
  type HTTP_CLIENT_ERROR_is_exported = HTTP_CLIENT_ERROR;
  type HTTP_BANNED_is_exported = HTTP_BANNED;
  type HTTP_NOT_FOUND_is_exported = HTTP_NOT_FOUND;
  type HTTP_SERVER_ERROR_is_exported = HTTP_SERVER_ERROR;
  type HTTP_INFO_ALL_is_exported = HTTP_INFO_ALL;
  type HTTP_SUCCESS_ALL_is_exported = HTTP_SUCCESS_ALL;
  type HTTP_REDIRECTION_ALL_is_exported = HTTP_REDIRECTION_ALL;
  type HTTP_ERROR_ALL_is_exported = HTTP_ERROR_ALL;
  type HTTP_CLIENT_ERROR_ALL_is_exported = HTTP_CLIENT_ERROR_ALL;
  type HTTP_SERVER_ERROR_ALL_is_exported = HTTP_SERVER_ERROR_ALL;

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// ---------------------------------------------------------------------------
// Test methods

describe('cacheControl', () => {
  test('works with `Response`', () => {
    const res = new Response('', { headers: { 'Cache-Control': 'public, max-age=17' } });
    const spy = spyOn(res.headers, 'set');

    expect(cacheControl(res, 'unset')).toEqual(undefined);
    expect(res.headers.get('Cache-Control')).toEqual(null);

    expect(cacheControl(res, '1s')).toEqual(undefined);
    expect(spy).toHaveBeenCalled();
    expect(res.headers.get('Cache-Control')).toEqual('private, max-age=1, immutable');
    // sets X-Cache-Control in dev mode
    if (process.env.NODE_ENV !== 'production') {
      expect(res.headers.get('X-Cache-Control')).toEqual('private, max-age=1, immutable');
    } else {
      expect(res.headers.get('X-Cache-Control')).toBeUndefined();
    }

    // repeat calls update the header
    cacheControl(res, '2s', 'my-etag-123'); // Setting ETag works
    expect(res.headers.get('Cache-Control')).toEqual('private, max-age=2, immutable');
    expect(res.headers.get('ETag')).toEqual('my-etag-123');
  });

  test('works with `ServerResponse`', () => {
    const res = new ServerResponse(new IncomingMessage(new Socket()));
    const spy = spyOn(res, 'setHeader');

    expect(cacheControl(res, '1s')).toEqual(undefined);
    expect(spy).toHaveBeenCalled();
    // TODO: Remove these `[...spy.mock.calls]` hacks as soon as possible.
    // This somehow fails, as when `bun test` is running, calling setHeader
    // on ServerResponse does not actually set the header.

    // expect(res.getHeader('Cache-Control')).toEqual('private, max-age=1, immutable');
    expect(
      [...spy.mock.calls].reverse().find((args) => args[0] === 'Cache-Control')
    ).toEqual(['Cache-Control', 'private, max-age=1, immutable']);

    // sets X-Cache-Control in dev mode
    if (process.env.NODE_ENV !== 'production') {
      // expect(res.getHeader('X-Cache-Control')).toEqual('private, max-age=1, immutable');
      expect(
        [...spy.mock.calls].reverse().find((args) => args[0] === 'X-Cache-Control')
      ).toEqual(['X-Cache-Control', 'private, max-age=1, immutable']);
    } else {
      // expect(res.getHeader('X-Cache-Control')).toBeUndefined();
      expect(
        [...spy.mock.calls].reverse().find((args) => args[0] === 'X-Cache-Control')
      ).toBeUndefined();
    }

    // repeat calls update the header
    cacheControl(res, '2s', 'my-etag-123'); // Setting ETag works
    // expect(res.getHeader('Cache-Control')).toEqual('private, max-age=2, immutable');
    expect(
      [...spy.mock.calls].reverse().find((args) => args[0] === 'X-Cache-Control')
    ).toEqual(['X-Cache-Control', 'private, max-age=2, immutable']);
    expect([...spy.mock.calls].reverse().find((args) => args[0] === 'ETag')).toEqual([
      'ETag',
      'my-etag-123',
    ]);
  });

  test('works with `Map`', () => {
    const map = new Map();
    const spy = spyOn(map, 'set');

    expect(cacheControl(map, '1s')).toEqual(undefined);
    expect(spy).toHaveBeenCalled();
    expect(map.get('Cache-Control')).toEqual('private, max-age=1, immutable');
    // sets X-Cache-Control in dev mode
    if (process.env.NODE_ENV !== 'production') {
      expect(map.get('X-Cache-Control')).toEqual('private, max-age=1, immutable');
    } else {
      expect(map.get('X-Cache-Control')).toBeUndefined();
    }

    // repeat calls update the header
    cacheControl(map, '2s', 'my-etag-123'); // Setting ETag works
    expect(map.get('Cache-Control')).toEqual('private, max-age=2, immutable');
    expect(map.get('ETag')).toEqual('my-etag-123');
  });
});

// ---------------------------------------------------------------------------

describe('cacheControlHeaders', () => {
  test('works', () => {
    expect(cacheControlHeaders('unset')).toEqual({});

    expect(cacheControlHeaders('1s')).toEqual({
      'Cache-Control': 'private, max-age=1, immutable',
      ...(process.env.NODE_ENV !== 'production'
        ? { 'X-Cache-Control': 'private, max-age=1, immutable' }
        : undefined),
    });

    expect(cacheControlHeaders({ maxAge: '2m', publ: true }, 'my-etag-123')).toEqual({
      'Cache-Control': 'public, max-age=120, immutable',
      ...(process.env.NODE_ENV !== 'production'
        ? { 'X-Cache-Control': 'public, max-age=120, immutable' }
        : undefined),
      ETag: 'my-etag-123',
    });
  });
});

// ---------------------------------------------------------------------------

describe('toSec', () => {
  test('works', () => {
    expect(toSec(123)).toEqual(123);
    expect(toSec(123.7)).toEqual(124);
    expect(toSec(-1)).toEqual(0);

    expect(toSec('1s')).toEqual(1);
    expect(toSec('-2s')).toEqual(0);
    expect(toSec('2m')).toEqual(120);
    expect(toSec('2.5m')).toEqual(150);
    expect(toSec('2h')).toEqual(7_200);
    expect(toSec('3d')).toEqual(259_200);
    expect(toSec('4w')).toEqual(2_419_200);

    // @ts-expect-error  (testing bad input)
    const bad1: TTL = 'halló';
    // @ts-expect-error  (testing bad input)
    const bad2: TTL = undefined;
    expect(toSec(bad1)).toEqual(0);
    expect(toSec(bad2)).toEqual(0);
  });
});

// ---------------------------------------------------------------------------

describe('toMs', () => {
  test('works', () => {
    expect(toMs(123)).toEqual(123_000);
    expect(toMs(123.7)).toEqual(124_000);
    expect(toMs(-1)).toEqual(0);

    expect(toMs('1s')).toEqual(1_000);
    expect(toMs('-2s')).toEqual(0);
    expect(toMs('4w')).toEqual(2_419_200_000);

    // @ts-expect-error  (testing bad input)
    const bad1: TTL = 'halló';
    // @ts-expect-error  (testing bad input)
    const bad2: TTL = undefined;
    expect(toMs(bad1)).toEqual(0);
    expect(toMs(bad2)).toEqual(0);
  });
});
