import React, { FunctionComponent } from 'react';
import { Cleanup } from '@reykjavik/hanna-utils';
import { ServerResponse } from 'http';
import type { AppProps, AppType } from 'next/app';

import type { HTTP_418_ImATeapot, HTTP_ERROR, TTLConfig } from '../http';
import { cacheControl, HTTP_304_NotModified } from '../http';

type HTTP_ERROR_all = HTTP_ERROR | typeof HTTP_418_ImATeapot;

/*
  Re-export all of the base [http module](#reykjavikwebtoolshttp)'s exports,
  purely for convenience.
*/
export * from '../http';

// ---------------------------------------------------------------------------
type NextContextLike = { res: ServerResponse };

export type ErrorProps = {
  statusCode: HTTP_ERROR_all;
  message?: string;
};

type ErrorizedPageProps<EP extends ErrorProps = ErrorProps> =
  | {
      __error: ErrorProps;
    } & Omit<EP, keyof ErrorProps>;

// ===========================================================================

type ShowErrorPageFn<EP extends ErrorProps = ErrorProps> = (
  response: ServerResponse | NextContextLike,
  error: (ErrorProps extends EP ? HTTP_ERROR_all : never) | EP,
  /** Defaults to `"2s"`. Gets forwarded on to the `cacheControl` helper from `@reykjavik/webtools/http` */
  ttl?: TTLConfig
) => { props: ErrorizedPageProps<EP> };

/**
 * Use this method inside a `getServerSideProps` method (or API route)
 * to return an error page with proper HTTP status code and all the shit.
 *
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1#showerrorpage-helper
 */
const showErrorPage: ShowErrorPageFn = (response, error, ttl = '2s') => {
  error =
    typeof error === 'number'
      ? ({ statusCode: error } as Exclude<typeof error, number>)
      : error;
  const { statusCode, message, ...otherProps } = error;
  response = 'res' in response ? response.res : response;
  response.statusCode = error.statusCode;
  cacheControl(response, ttl);
  return {
    props: {
      ...otherProps,
      __error: { statusCode, message },
    },
  };
};

export type InferErrorPageProps<SEP extends ShowErrorPageFn<any>> = Cleanup<
  ReturnType<SEP>['props']
>;

// ===========================================================================

/**
 * Hhigher-order component (HOC) factory for Next.js App compnents to handle
 * cases when `getServerSideProps` returns an `__error` prop with `statusCode`
 * and optional friendly `message`.
 *
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1#makeerrorizeapphoc
 */
export const makeErrorizeAppHOC = <EP extends Partial<ErrorProps>>(
  ErrorPage: FunctionComponent<EP>
) => {
  // the HOC
  const withErrorHandling = <P extends { [key: string]: unknown; __error?: never }>(
    App: AppType<P>
  ) => {
    const ErrorizedApp: AppType<P | ErrorizedPageProps<ErrorProps & EP>> = (appProps) => {
      const { pageProps } = appProps;
      if (pageProps.__error) {
        const { __error, ...otherProps } = pageProps;
        return (
          <App
            {...appProps}
            Component={ErrorPage}
            pageProps={{
              ...(otherProps as unknown as EP & P),
              ...__error,
            }}
          />
        );
      }
      return <App {...(appProps as AppProps<P>)} />;
    };
    ErrorizedApp.getInitialProps = App.getInitialProps;
    ErrorizedApp.displayName = 'Errorized' + (App.displayName || App.name || 'App');
    return ErrorizedApp;
  };

  withErrorHandling.showErrorPage = showErrorPage as unknown as ShowErrorPageFn<
    ErrorProps & EP
  >;

  return withErrorHandling;
};

// ===========================================================================

/**
 * Use this method to inside a `getServerSideProps` method (or API route)
 * to return an `HTTP_304_NotModified` response with an empty props object,
 * in a way that doesn't make TypeScript at you.
 *
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1#notmodified304-helper
 */
export const notModified304 = (response: ServerResponse | NextContextLike) => {
  response = 'res' in response ? response.res : response;
  response.statusCode = HTTP_304_NotModified;
  return {
    props:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
  } as const;
};

// ---------------------------------------------------------------------------
