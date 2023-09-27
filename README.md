# @reykjavik/webtools

Miscellaneous JavaScript/TypeScript helpers used by Reykjavík City's web dev
teams.

This library is split up into multiple individual modules to help keep your
bundles slim and allow tree-shaking.

```
yarn add @reykjavik/webtools
```

**Table of Contents:**

<!-- prettier-ignore-start -->

- [`@reykjavik/webtools/http`](#reykjavikwebtoolshttp)
  - [HTTP Status Codes](#http-status-codes)
  - [Types for HTTP Status code groups](#types-for-http-status-code-groups)
  - [`cacheControl` helper](#cachecontrol-helper)
    - [Type `TTLConfig`](#type-ttlconfig)
  - [`toSec` TTL helper](#tosec-ttl-helper)
- [`@reykjavik/webtools/next/http`](#reykjavikwebtoolsnexthttp)
  - [`makeErrorizeAppHOC`](#makeerrorizeapphoc)
  - [`showErrorPage` helper](#showerrorpage-helper)
  - [`notModified304` helper](#notmodified304-helper)
- [`@reykjavik/webtools/CookieHubConsent`](#reykjavikwebtoolscookiehubconsent)
  - [`CookieHubProvider` component](#cookiehubprovider-component)
  - [`useCookieHubConsent`](#usecookiehubconsent)
- [`@reykjavik/webtools/next/SiteImprove`](#reykjavikwebtoolsnextsiteimprove)
  - [`SiteImprove` component](#siteimprove-component)
  - [`pingSiteImprove` helper](#pingsiteimprove-helper)
  - [`pingSiteImproveOutbound` helper](#pingsiteimproveoutbound-helper)

<!-- prettier-ignore-start -->

---

## `@reykjavik/webtools/http`

Various framework agnostic helpers for leveraging HTTP magic.

### HTTP Status Codes

All the web-related HTTP status codes are exported with human-readable names:

- `HTTP_200_OK`
- `HTTP_303_SeeOther`
- `HTTP_304_NotModified`
- `HTTP_307_TemporaryRedirect`
- `HTTP_308_PermanentRedirect`
- `HTTP_400_BadRequest`
- `HTTP_401_Unauthorized`
- `HTTP_403_Forbidden`
- `HTTP_404_NotFound`
- `HTTP_418_ImATeapot`
- `HTTP_500_InternalServerError`
- ...ad nauseum.

### Types for HTTP Status code groups

These type unions are useful when writing HTTP helper functions and error
handling, etc.

Union Types for the more commonly occurrring HTTP Status codes:

- `HTTP_STATUS` (all the status-codes!)
  - `HTTP_INFO` (100, 101)
  - `HTTP_SUCCESS` (200, 201, 202)
  - `HTTP_REDIRECTION` (301, 302, 303, 304, 307, 308)
    - `HTTP_NOTMODIFIED` (304)
  - `HTTP_ERROR`
    - `HTTP_CLIENT_ERROR`
      - `HTTP_NOT_FOUND` (400, 404, 410)
      - `HTTP_BANNED` (401, 403)
    - `HTTP_SERVER_ERROR` (500)

More complete union types, including all the esoteric status codes, are also
available:

- `HTTP_STATUS` (all the status-codes!)
  - `HTTP_INFO_ALL` (1\*\*)
  - `HTTP_SUCCESS_ALL` (2\*\*)
  - `HTTP_REDIRECTION_ALL` (3\*\*)
  - `HTTP_ERROR_ALL`
    - `HTTP_CLIENT_ERROR_ALL` (4\*\*)
    - `HTTP_SERVER_ERROR_ALL` (4\*\*)

### `cacheControl` helper

**Syntax:**
`cacheConrol(response: ServerResponse | { res: ServerResponse }, ttlCfg: TTLConfig, eTag?: string|number): void`

Use this function to quickly set the `Cache-Control` header with a `max-age=`
on a HTTP response.

```js
import { cacheControl } from '@reykjavik/webtools/http';

// ...then inside an API handler
// or a framework's data loader function
cacheControl(res, '4h');
// ...then set statusCode and send data
```

The directives `private` and `immutable` are used by by default.

Use the optional `eTag` parameter if you intend to
[handle conditional requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests).

#### Type `TTLConfig`

```js
import type { TTLConfig } from '@reykjavik/webtools/http';

const myTTL1: TTLConfig = '4s';
const myTTL2: TTLConfig = { maxAge: '4s' };
```

The `ttlCfg` parameter is either a bare `TTL` (max-age) value:

- `number` — seconds
- `"${number}${'s'|'m'|'h'|'d'|'w'}"` — gets converted to seconds

…one of these `TTLKeywords`:

- `"permanent"` — an alias for `maxAge: '365d'`
- `"no-cache"` — disables caching
- `"unset"` — removes the header altogether

…or a more complex `TTLConfig` object with the following properties:

**`TTLConfig.maxAge: TTL | TTLKeywords`** (required)

Sets the `max-age=` directive. See above definitions

(NOTE: Second values of zero or less get converted to `"no-cache"`.)

**`TTLConfig.staleWhileRevalidate?: TTL`**

If set to a positive value then `stale-while-revalidate=` is added to the
response header

**`TTLConfig.staleIfError?: TTL`**

If set to a positive value then `stale-if-error=` is added to the response
header

**`TTLConfig.publ?: boolean`**

Sets the response caching as "public", instead of the default "private"

**`TTLConfig.stability?: 'revalidate' | 'immutable' | 'normal'`**

Allows setting a "must-revalidate" flag instead of the default "immutable". A
value of `"normal"` omits the flagging and falls back to HTTP's default
behavior.

### `toSec` TTL helper

**Syntax:** <code>toSec; (ttl: number | `${number}${'s'|'m'|'h'|'d'|'w'}`) =>
number</code>

Converts a `TTL` (max-age) value into seconds, and returns `0` for bad and/or
negative input values.

```js
import type { toSec, TTL } from '@reykjavik/webtools/http';

const ttl: TTL = '2h';

const ttlSec = toSec(ttl);
```

---

## `@reykjavik/webtools/next/http`

Contains HTTP helpers for Next.js projects

Re-exports all of the base [http module](#reykjaviktoolshttp)'s exports, for
convenience

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
`showErrorPage = (response: ServerResponse | NextContext, error: HTTP_ERROR | ErrorProps, ttl?: TTL | TTLConfig): void`

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
[`TTLConfig`](#type-ttlconfig).

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

## `@reykjavik/webtools/CookieHubConsent`

Contains React helpers for loading CookieHub's consent manager and reading
users' consent values.

### `CookieHubProvider` component

This context provider component loads and initialises the CookieHub consent
management script and sets up a React state object with the relevant user
consent flags.

Wrap this provider around your component tree, and then use the
[`useCookieHubConsent()` hook](#usecookiehubconsent) to retrieve live consent
information, whereever you wish to set GDPR-affected cookies or perform any
sort of tracking/logging.

```js
import { CookieHubProvider } from '@reykjavik/webtools/CookieHubConsent';

import { AnalyticsStuff } from '../components/AnalyticsStuff';

// Maybe move this to an Env variable, or something...
const cookiehubAccountId = '[ACCOUNT_ID]'; // e.g. "a4b3c2d1"

export default function App() {
  return (
    <CookieHubProvider accountId={cookiehubAccountId}>
      <div>
        <p>...my App UI...</p>
        <AnalyticsStuff />
      </div>
    </CookieHubProvider>
  );
}
```

**Props:**

The Component's props have detailed JSDoc comments (displayed in your code
editor), but there's a brief summary:

- `accountId?: string` — Your CookieHub account ID. (alternative to
  `scriptUrl` prop).
- `scriptUrl?: string` — The full CookieHub embed script URL. (alternative to
  `accountId` prop).
- `options?: CookieHubOptions` — Raw CookieHub options object that gets used
  when the script initializes.
- `onError?: OnErrorEventHandlerNonNull` — Fires if loading the script failed.

### `useCookieHubConsent`

**Syntax:** `useCookieHubConsent(): Record<CookieHubCategory, boolean>`

Returns up-to-date cookie consent `boolean` flags. For use in React components
or hook functions.

```js
import { useCookieHubConsent } from '@reykjavik/webtools/CookieHubConsent';

export const AnalyticsStuff = (props) => {
  const consent = useCookieHubConsent();
  if (!consent.analytics) {
    return null;
  }
  // Perform analytics...
};
```

If the `CookieHubProvider` is missing from the VDOM tree above your component,
this hook will return an empty object.

---

## `@reykjavik/webtools/next/SiteImprove`

Contains React helpers for loading SiteImprove's analytics scripts in Next.js
applications and perform custom event tracking.

### `SiteImprove` component

A component for loading a SiteImprove analytics script and set up page-view
tracking across Next.js routes.

It also automatically logs all out-bound link clicks.

Example usage in pages/\_app.tsx

```js
import { SiteImprove } from '@reykjavik/webtools/next/SiteImprove';

const siteImproveAccountId = '[ACCOUNT_ID]'; // e.g. "7654321"

// Inside MyApp component
<Component {...pageProps} />
<SiteImprove
  accountId={siteImproveAccountId}
  onError={(error) =>
    Logger('error', 'An error occured initializing siteimprove', error)
  }
/>;
```

The component has an optional `hasConsented` prop which can be used to
forcefully suppress loading the analytics script.

In dev mode it does NOT load the SiteImprove script and only logs page-view
events to the console.

**Props:**

The Component's props have detailed JSDoc comments (displayed in your code
editor), but there's a brief summary:

- `accountId?: string` — Your SiteImprove account ID. (alternative to
  `scriptUrl` prop).
- `scriptUrl?: string` — The full SiteImprove analytics script URL.
  (alternative to `accountId` prop).
- `hasConstented?: boolean` — Manual GDPR 'analytics' consent flag. Allows
  hard opt-out, but defers to
  [`CookieHubProvider` values](#usecookiehubconsent) if they are available.
- `onLoad?: (e: unknown) => void` — Fires when the script has loaded.
- `onError?: (e: unknown) => void` — Fires if loading the script failed.

### `pingSiteImprove` helper

**Syntax:**
`pingSiteImprove(category: string, action: string, label?: string): void`

A small helper for tracking custom UI events and reporting them to SiteImrove.

It safely manages GDPR consent, so you can use it unconditionally.

```js
import { pingSiteImprove } from '@reykjavik/webtools/next/SiteImprove';

const handleSubmit = () => {
  // perform submit action...
  if (success) {
    pingSiteImprove('application', 'add_new');
  }
};
```

### `pingSiteImproveOutbound` helper

**Syntax:** `pingSiteImproveOutbound(ourl: string): void`

A small helper for reporting to SiteImrove when the user is programmatically
being sent to a different URL/resource.

```js
import { pingSiteImproveOutbound } from '@reykjavik/webtools/next/SiteImprove';

const handleSubmit = () => {
  // perform submit action...
  if (success) {
    const fileUrl ='/download/report.pdf'
    pingSiteImproveOutbound(fileUrl);
    document.location.href = fileUrl
  }
};



---

## Changelog

See
[CHANGELOG.md](https://github.com/reykjavikcity/webtools/blob/main/CHANGELOG.md)
```
