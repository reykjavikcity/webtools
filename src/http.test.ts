import { describe, expect, spyOn, test } from 'bun:test';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';

import { cacheControl, toSec } from './http.js';

describe('cacheControl', () => {
  test('works', () => {
    const res = new ServerResponse(new IncomingMessage(new Socket()));
    const spy = spyOn(res, 'setHeader');

    expect(cacheControl(res, '1s')).toEqual(undefined);
    expect(spy).toHaveBeenCalled();
    // TODO: Remove hack as soon as possible
    // This somehow fails, as when `bun test` is running, calling setHeader
    // on ServerResponse does not actually set the header.

    // expect(res.getHeader('Cache-Control')).toEqual('private, max-age=1, immutable');
    expect(
      [...spy.mock.calls].reverse().find((args) => args[0] === 'Cache-Control')
    ).toEqual(['Cache-Control', 'private, max-age=1, immutable']);
  });

  test('sets X-Cache-Control in dev mode', () => {
    const res = new ServerResponse(new IncomingMessage(new Socket()));
    const spy = spyOn(res, 'setHeader');
    cacheControl(res, '1s');
    // TODO: Remove hack as soon as possible
    // This somehow fails, as when `bun test` is running, calling setHeader
    // on ServerResponse does not actually set the header.

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
  });
});

describe('toSec', () => {
  test('works', () => {
    expect(toSec(123)).toEqual(123);
    expect(toSec(123.7)).toEqual(124);
    expect(toSec(-1)).toEqual(0);

    expect(toSec('1s')).toEqual(1);
    expect(toSec('-2s')).toEqual(0);
    expect(toSec('2m')).toEqual(120);
    expect(toSec('2.5m')).toEqual(150);
    expect(toSec('2h')).toEqual(7200);
    expect(toSec('3d')).toEqual(259200);
    expect(toSec('4w')).toEqual(2419200);

    // @ts-expect-error  (testing bad input)
    const bad1: TTL = 'halló';
    // @ts-expect-error  (testing bad input)
    const bad2: TTL = undefined;
    expect(toSec(bad1)).toEqual(0);
    expect(toSec(bad2)).toEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Testing exports

/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports-ts, import/first, simple-import-sort/imports */
import * as moduleExports from './http.js';

// `false` condition guarantees that the following code is never executed
if (false as boolean) {
  const exports: Record<keyof typeof moduleExports, true> = {
    toSec: true,
    cacheControl: true,
    HTTP_100_Continue: true,
    HTTP_101_SwitchingProtocols: true,

    HTTP_200_OK: true,
    HTTP_201_Created: true,
    HTTP_202_Accepted: true,
    HTTP_203_NonAuthoritativeInformation: true,
    HTTP_204_NoContent: true,
    HTTP_206_PartialContent: true,

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
    HTTP_510_NotExtended: true,
    HTTP_511_NetworkAuthenticationRequired: true,
  };
}
import type {
  TTL,
  TTLConfig,
  HTTP_STATUS,
  HTTP_INFO,
  HTTP_SUCCESS,
  HTTP_REDIRECTION,
  HTTP_NOTMODIFIED,
  HTTP_ERROR,
  HTTP_CLIENT_ERROR,
  HTTP_BANNED,
  HTTP_NOT_FOUND,
  HTTP_SERVER_ERROR,
  HTTP_INFO_ALL,
  HTTP_SUCCESS_ALL,
  HTTP_REDIRECTION_ALL,
  HTTP_ERROR_ALL,
  HTTP_CLIENT_ERROR_ALL,
  HTTP_SERVER_ERROR_ALL,
} from './http.js';
/* eslint-enable */
