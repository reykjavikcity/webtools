import { expect, jest, test } from '@jest/globals';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';

import { cacheControl } from './http';

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
import * as moduleExports from './http';

// `false` condition guarantees that the following code is never executed
if (false as boolean) {
  const exports: Record<keyof typeof moduleExports, true> = {
    cacheControl: true,
    HTTP_200_OK: true,
    HTTP_201_Created: true,
    HTTP_202_Accepted: true,
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
    HTTP_410_Gone: true,
    HTTP_418_ImATeapot: true,
    HTTP_500_InternalServerError: true,
  };
}
import type {
  TTLConfig,
  HTTP_BANNED,
  HTTP_CLIENT_ERROR,
  HTTP_ERROR,
  HTTP_NOTMODIFIED,
  HTTP_NOT_FOUND,
  HTTP_REDIRECTION,
  HTTP_SERVER_ERROR,
  HTTP_STATUS,
  HTTP_SUCCESS,
} from './http';
/* eslint-enable */
