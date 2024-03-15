# @reykjavik/webtools/next/\*

These are the [Next.js](https://nextjs.org/)-specific utilities in the
`@reykjavik/webtools` package.

**Contents:**

<!-- prettier-ignore-start -->

- [`@reykjavik/webtools/next/http`](#reykjavikwebtoolsnexthttp)
  - [`makeErrorizeAppHOC`](#makeerrorizeapphoc)
  - [`showErrorPage` helper](#showerrorpage-helper)
  - [`notModified304` helper](#notmodified304-helper)
- [~~`@reykjavik/webtools/next/SiteImprove`~~ (deprecated)](#reykjavikwebtoolsnextsiteimprove-deprecated)

<!-- prettier-ignore-end -->

---

## `@reykjavik/webtools/next/http`

Contains HTTP helpers for Next.js projects

Re-exports all of the base [http module](./README.md#reykjaviktoolshttp)'s
exports, for convenience

### `makeErrorizeAppHOC`

**Syntax:**
`makeErrorizeAppHOC(ErrorPageComponent: ComponentType<EP>): (App: AppType<P>) => AppType<P | EP>`

Hhigher-order component (HOC) factory for Next.js App compnents to handle
cases when `getServerSideProps` returns an `__error` prop with `statusCode`
and optional friendly `message`.

Pass in an error-page compnent, and receive a HOC function that wraps any
Next.js App compnent. The HOC also has a type-safe
[`.showErrorPage`](#showerrorizedpage-helper) helper method to use inside
`getServerSideProps` in order to trigger display of the error page.

Set up the error page for your app:

```tsx
// src/helpers/myerrors.js

import {
  makeErrorizeAppHOC,
  ErrorProps,
  InferErrorPageProps,
} from '@reykjavik/webtools/next/http';

type MyErrorPageProps = ErrorProps & {
  /* ...custom props... */
};
const MyErrorPage = (props: MyErrorPageProps) => {
  const { statusCode, message /* plus your custom props */ } = props;
  return (
    <div>
      <h1>{statusCode}</h1>
      {message && <p>{message}</p>}
    </div>
  );
};

// Generate and export the HOC
export const withMyErrorHandling = makeErrorizeAppHOC(MyErrorPage);
// Export the gSSP helper
export const showErrorPage = withMyErrorHandling.showErrorPage;
// Export the props type of the error page
export type ErrorPageProps = InferErrorPageProps<typeof showErrorPage>;
```

Wrap `_app.tsx` with the HOC you generated:

```jsx
// src/pages/_app.js

import { withMyErrorHandling } from '~/helpers/myerrors';

const App = ({ Component, pageProps }: AppProps<PageProps>) => {
  // ...define your App component as normal...
};

export default withMyErrorHandling(App);
```

Return errors inside your page/route modules, using `showErrorPage`

```tsx
// src/pages/index.js

import type { GetServerSideProps } from 'next';
import { showErrorPage, ErrorPageProps } from '~/helpers/errors';

type MyPageProps = {};
// Export the page component
export default function MyPage(props: MyPageProps) {
  // ...
}

export const getServerSideProps: GetServerSideProps<
  MyPageProps | ErrorPageProps
> = async (ctx) => {
  // ...fetch data from api
  if (!apiRes.error === 'unauthorized') {
    return showErrorPage(ctx.res, {
      statusCode: HTTP_400_BadRequest,
      // ...Add other custom MyErrorPage props
    });
  }
  // ...return normal, happy page props.
};
```

See more below

### `showErrorPage` helper

**Syntax:**
`showErrorPage(response: ServerResponse | NextContext, error: HTTP_ERROR | ErrorProps, ttl?: TTL | TTLConfig): void`

This method is attached to the HOC returned by
[`makeErrorizeAppHOC`](#makeerrorizeapphoc). Use it inside your pages'
`getServerSideProps` to return the appropriate an "error" props, including a
HTTP `statusCode`, etc.

```js
import { showErrorPage, ErrorPageProps } from '~/helpers/myerrors';

// ...then, somewhere inside getServerSideProps
if (invalidParams) {
  return showErrorPage(
    res,
    {
      statusCode: HTTP_400_BadRequest,
      message: 'You passed me bad params :-(', // optional message
      // ...Add other custom MyErrorPage props
    },
    'permanent'
  );
}

if (!apiRes.error === 'unauthorized') {
  // Optional `statusCode` shorthand signature, available if your
  // error page has no required props (other than `statusCode`).
  return showErrorPage(res, HTTP_403_Forbidden);
}

// ...return normal, happy page props.
```

The `ttl` parameter defaults to `'2s'`, but you can pass any
[`TTLConfig`](./README.md#type-ttlconfig).

### `notModified304` helper

**Syntax:** `notModified304(response: ServerResponse | NextContext): void`

Use this method to inside a `getServerSideProps` method (or API route) to
return a `HTTP_304_NotModified` response with an empty props object, in a way
that doesn't make TypeScript shout at you.

(Turns out that when a 304 status is returned, then Next.js doesn't even
attempt to render the Page compnoent, so the returned props don't matter.
TypeScript, however, doesn't know that.)

```js
import { notModified304 } from '@reykjavik/webtools/next/http';

// ...then, somewhere inside getServerSideProps
const notModified = data.modifiedTimestamp === req.headers['if-none-match'];
if (notModified) {
  return notModified304(res);
}
```

---

<!-- #fragment anchors to not break older v0.1 @see links -->

<a name="reykjavikwebtoolsnextsiteimprove"></a>
<a name="siteimprove-component"></a> <a name="pingsiteimprove-helper"></a>
<a name="pingsiteimproveoutbound-helper"></a>

## ~~`@reykjavik/webtools/next/SiteImprove`~~ (deprecated)

This Next.js-specific import path has been deprecated in favor of the
framework-agnostic
[`@reykjavik/webtools/SiteImprove` module](./README.md#reykjavikwebtoolssiteimprove)
with the same features.

Update your import paths to use the new module, as this path will be removed
in the next major release of the library.
