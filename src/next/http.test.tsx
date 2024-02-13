import React, { ComponentType, ReactElement } from 'react';
import { Equals, Expect } from '@maranomynet/libtools';
import { expect, test } from 'bun:test';
import { ServerResponse } from 'http';
import { AppType } from 'next/app.js';
import { NextRouter } from 'next/router.js';

import { HTTP_400_BadRequest } from '../http.js';

import { ErrorProps, InferErrorPageProps, makeErrorizeAppHOC } from './http.js';

test('showErrorPage', () => {
  expect(3).toEqual(3);
});

// ---------------------------------------------------------------------------
// Type Tests
//
/* eslint-disable @typescript-eslint/no-unused-vars */
declare const res: ServerResponse;
declare const ErrPage1: (props: ErrorProps) => ReactElement;
declare const ErrPage2: (props: Partial<ErrorProps>) => ReactElement;
declare const ErrPage3: (props: ErrorProps & { foo: number }) => ReactElement;
declare const ErrPage4: (props: Partial<ErrorProps> & { foo: number }) => ReactElement;
declare const Page: ComponentType<{ data: boolean }>;
declare const App: AppType<typeof Page extends ComponentType<infer P> ? P : never>;
declare const router: NextRouter;

// `false` condition guarantees that the following code is never executed
if (false as boolean) {
  const hoc1 = makeErrorizeAppHOC(ErrPage1);
  const hoc2 = makeErrorizeAppHOC(ErrPage2);
  const hoc3 = makeErrorizeAppHOC(ErrPage3);
  const hoc4 = makeErrorizeAppHOC(ErrPage4);

  const AppE1 = hoc1(App);
  const AppE2 = hoc2(App);
  const AppE3 = hoc3(App);
  const AppE4 = hoc4(App);

  <div>
    <AppE1 router={router} Component={Page} pageProps={{ data: true }} />
    <AppE1
      router={router}
      Component={Page}
      pageProps={{ __error: { statusCode: HTTP_400_BadRequest } }}
    />
    <AppE2 router={router} Component={Page} pageProps={{ data: true }} />
    <AppE2
      router={router}
      Component={Page}
      pageProps={{ __error: { statusCode: HTTP_400_BadRequest } }}
    />
    <AppE3 router={router} Component={Page} pageProps={{ data: true }} />
    <AppE3
      router={router}
      Component={Page}
      pageProps={{ __error: { statusCode: HTTP_400_BadRequest }, foo: 42 }}
    />
    <AppE4 router={router} Component={Page} pageProps={{ data: true }} />
    <AppE4
      router={router}
      Component={Page}
      pageProps={{ __error: { statusCode: HTTP_400_BadRequest }, foo: 42 }}
    />
  </div>;

  const showErrorPage1 = hoc1.showErrorPage;
  const showErrorPage2 = hoc2.showErrorPage;
  const showErrorPage3 = hoc3.showErrorPage;
  const showErrorPage4 = hoc4.showErrorPage;

  showErrorPage1(res, HTTP_400_BadRequest);
  showErrorPage2(res, HTTP_400_BadRequest);
  showErrorPage3(
    res,
    // @ts-expect-error  (plain `HTTP_ERROR` is disallowed when some custom props are required)
    HTTP_400_BadRequest
  );
  showErrorPage3(res, { statusCode: HTTP_400_BadRequest, foo: 42 });
  // @ts-expect-error  (`statusCode` is always required when calling showErrorPage4)
  showErrorPage4(res, { foo: 42 });
  showErrorPage4(res, { statusCode: HTTP_400_BadRequest, foo: 42 });

  type T1 = Expect<
    Equals<
      InferErrorPageProps<typeof showErrorPage3>,
      { __error: ErrorProps; foo: number }
    >
  >;
  type T2 = Expect<
    Equals<
      InferErrorPageProps<typeof showErrorPage4>,
      { __error: ErrorProps; foo: number }
    >
  >;
}
/* eslint-enable */

// ---------------------------------------------------------------------------
// Testing exports

/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports-ts, import/first, simple-import-sort/imports */
import * as vannillaHttpExports from '../http.js';
import * as moduleExports from './http.js';

declare const vanillaHttpReExports: Record<keyof typeof vannillaHttpExports, true>;

if (false as boolean) {
  const exports: Record<keyof typeof moduleExports, true> = {
    makeErrorizeAppHOC: true,
    notModified304: true,
    ...vanillaHttpReExports,
  };
}

import type { ErrorProps as T1, InferErrorPageProps as T2 } from './http.js';
/* eslint-enable */
