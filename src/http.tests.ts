import { expect, jest, test } from '@jest/globals';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';

import { cacheControl } from './http.js';

test('cacheControl', () => {
  const res = new ServerResponse(new IncomingMessage(new Socket()));
  const spy = jest.spyOn(res, 'setHeader');

  expect(cacheControl(res, '1s')).toEqual(undefined);
  expect(spy).toHaveBeenCalled();
  expect(res.getHeader('Cache-Control')).toEqual('private, max-age=1, immutable');
});

// ---------------------------------------------------------------------------
// Testing exports

/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports-ts, import/first, simple-import-sort/imports */
import * as moduleExports from './http.js';

// `false` condition guarantees that the following code is never executed
if (false as boolean) {
  const exports: Record<keyof typeof moduleExports, true> = {
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
