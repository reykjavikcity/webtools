# @reykjavik/webtools <!-- omit from toc -->

Miscellaneous JavaScript/TypeScript helpers used by Reykjavík City's web dev
teams.

This library is split up into multiple individual modules to help keep your
bundles slim and aid tree-shaking.

```
npm install @reykjavik/webtools
yarn add @reykjavik/webtools
bun add @reykjavik/webtools
```

**Contents:**

<!-- prettier-ignore-start -->

- [`@reykjavik/webtools/http`](#reykjavikwebtoolshttp)
  - [HTTP Status Codes](#http-status-codes)
  - [Types for HTTP Status code groups](#types-for-http-status-code-groups)
  - [`cacheControl` helper](#cachecontrol-helper)
  - [`cacheControlHeaders` helper](#cachecontrolheaders-helper)
    - [Type `TTLConfig`](#type-ttlconfig)
  - [`toSec` TTL helper](#tosec-ttl-helper)
  - [`toMs` duration helper](#toms-duration-helper)
- [`@reykjavik/webtools/fixIcelandicLocale`](#reykjavikwebtoolsfixicelandiclocale)
  - [Limitations](#limitations)
- [`@reykjavik/webtools/async`](#reykjavikwebtoolsasync)
  - [`promiseAllObject`](#promiseallobject)
  - [`maxWait`](#maxwait)
- [`@reykjavik/webtools/errorhandling`](#reykjavikwebtoolserrorhandling)
  - [`asError`](#aserror)
  - [`Result` Singleton](#result-singleton)
  - [Type `ResultTuple`](#type-resulttuple)
  - [Type `ResultTupleObj`](#type-resulttupleobj)
  - [`Result.catch`](#resultcatch)
  - [`Result.map`](#resultmap)
  - [`Result.Success`](#resultsuccess)
  - [`Result.Fail`](#resultfail)
  - [`Result.throw`](#resultthrow)
- [`@reykjavik/webtools/SiteImprove`](#reykjavikwebtoolssiteimprove)
  - [`SiteImprove` component](#siteimprove-component)
  - [`pingSiteImprove` helper](#pingsiteimprove-helper)
  - [`pingSiteImproveOutbound` helper](#pingsiteimproveoutbound-helper)
- [`@reykjavik/webtools/CookieHubConsent`](#reykjavikwebtoolscookiehubconsent)
  - [`CookieHubProvider` component](#cookiehubprovider-component)
  - [`useCookieHubConsent`](#usecookiehubconsent)
- [`@reykjavik/webtools/vanillaExtract`](#reykjavikwebtoolsvanillaextract)
  - [`vanillaClass`](#vanillaclass)
  - [`vanillaGlobal`](#vanillaglobal)
  - [`vanillaProps`](#vanillaprops)
- [Framework Specific Tools](#framework-specific-tools)
  - [Remix.run Tools](#remixrun-tools)
  - [Next.js Tools](#nextjs-tools)
- [Contributing](#contributing)
- [Changelog](#changelog)

<!-- prettier-ignore-end -->

---

## `@reykjavik/webtools/http`

Various framework agnostic helpers for leveraging HTTP magic.

### HTTP Status Codes

All the web-related HTTP status codes are exported with human-readable names
and a short JSDoc comment:

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

These make your code more readable and less prone to accidental mistakes:

```ts
import { HTTP_200_OK, HTTP_404_NotFound } from '@reykjavik/webtools/http';

console.log(HTTP_200_OK); // 200
console.log(HTTP_404_NotFound); // 404
```

### Types for HTTP Status code groups

These type unions are useful when writing HTTP helper functions and error
handlers, etc.

Union Types for the more commonly occurrring HTTP Status codes:

- `HTTP_INFO` (100, 101)
- `HTTP_SUCCESS` (200, 201, 202)
- `HTTP_REDIRECTION` (301, 302, 303, 304, 307, 308)
  - `HTTP_NOTMODIFIED` (304)
- `HTTP_ERROR` (400, 404, 410, 401, 403, 500)
  - `HTTP_CLIENT_ERROR` (400, 404, 410, 401, 403)
    - `HTTP_NOT_FOUND` (400, 404, 410)
    - `HTTP_BANNED` (401, 403)
  - `HTTP_SERVER_ERROR` (500)

It also offers more complete union types, including all the esoteric status
codes, are also available:

- `HTTP_STATUS` (**all** the status-codes!)
  - `HTTP_INFO_ALL` (1\*\*)
  - `HTTP_SUCCESS_ALL` (2\*\*)
  - `HTTP_REDIRECTION_ALL` (3\*\*)
  - `HTTP_ERROR_ALL` (4\*\* and 5\*\*)
    - `HTTP_CLIENT_ERROR_ALL` (4\*\*)
    - `HTTP_SERVER_ERROR_ALL` (5\*\*)

### `cacheControl` helper

**Syntax:**
`cacheConrol(response: ServerResponse | Response | Map<string, string> | { res: ServerResponse | Response }, ttlCfg: TTLConfig, eTag?: string|number): void`

Use this function to quickly set the `Cache-Control` header with a `max-age=`
on a HTTP response (or a `Map` object representing response headers).

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

### `cacheControlHeaders` helper

**Syntax:**
`cacheControlHeaders(ttlCfg: TTLConfig, eTag?: string|number): Record<string, string>`

Similar to the [`cacheControl` helper](#cachecontrol-helper), but returns an
plain object with the headers for use in situations where `HeadersInit` object
are expected.

```js
import { cacheControlHeaders } from '@reykjavik/webtools/http';

const response = new Response('Hello, World!', {
  headers: cacheControlHeaders('4h'),
});
```

```js

```

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

**Syntax:**
`` toSec(ttl: number | `${number}${'s'|'m'|'h'|'d'|'w'}`): number ``

Converts a `TTL` (max-age) value into seconds. Returns `0` for bad and/or
negative input values.

```js
import type { toSec, TTL } from '@reykjavik/webtools/http';

const ttl: TTL = '2h';

const ttlSec = toSec(ttl);
```

### `toMs` duration helper

**Syntax:**
`` toSec(duration: number | `${number}${'s'|'m'|'h'|'d'|'w'}`): number ``

Converts a `TTL` (duration) value into milliseconds. Returns `0` for bad
and/or negative input values.

```js
import type { toMs, TTL } from '@reykjavik/webtools/http';

const ttl: TTL = '2h';

const ttlSec = toMs(ttl);
```

---

## `@reykjavik/webtools/fixIcelandicLocale`

As of early 2024, Google Chrome still does not support the Icelandic locale
`is`/`is-IS` in any way. Meanwhile other browsers have supported it for over a
decade.

This module patches the following methods/classes by substituting the `is`
locale with `da` (Danish) and apply a few post-hoc fixes to their return
values.

- `Intl.Collator` and `String.prototype.localeCompare` (\*)
- `Intl.NumberFormat` and `Number.prototype.toLocaleString` (\*)
- `Intl.DateTimeFormat` and `Date.prototype.toLocaleString`,
  `.toLocaleDateString`, and `.toLocaleTimeString` (\*)
- `Intl.RelativeDateFormat`
- `Intl.PluralRules`
- `Intl.ListFormat`

(\*) The results are quite usable, but not entirely perfect. The
limitations/caveats are listed below.

To apply the patch, simply "side-effect import" this module at the top of your
app's entry point:

```ts
import '@reykjavik/webtools/fixIcelandicLocale';

// Then continue with your day and use `localeCompare` and other Intl.* methods
// as you normally would. (See "limitations" below.)
```

(**NOTE** The patch is only applied in engines that fail a simple feature
detection test.)

### Limitations

**`Intl.Collator` and `localeCompare`:**

- It sorts initial letters correctly but in the rest of the string, it
  incorrectly treats `ð` and `d` as the same letter (most of the time), and
  lumps the acute-accented characters `á`, `é`, `í`, `ó`, `ú` and `ý` in with
  their non-accented counterparts.

**`Intl.NumberFormat` and `toLocaleString`:**

- The `style: "unit"` option is not supported and prints units in Danish. (Soo
  many units and unit-variants…)
- The `currencyDisplay: "name"` option is not supported and prints the
  currency's full name in Danish.

**`Intl.DateTimeFormat` and `toLocaleDateString`:**

- The `month: 'narrow'` and `weekday: 'narrow'` options are not supported, and
  print the corresponding Danish initials.
- For `timeZoneName` the values `"long"`, `"shortGeneric"` and `"longGeneric"`
  will appear in Danish.
- The `timeStyle: 'full'` option prints the timezone names in Danish
- The `dayPeriod` option has a couple of slight mismatches, at 5 am and 12
  noon.

We eagerly accept bugfixes, additions, etc. to this module!

---

## `@reykjavik/webtools/async`

Contains a few small helpers for working with async functions and promises.

---

### `promiseAllObject`

**Syntax:**
`promiseAllObject<T extends PlainObj>(promisesMap: T>): Promise<{ [K in keyof T]: Awaited<T[K]>; }>`

A variation of `Promise.all()` that accepts an object with named promises and
returns a same-shaped object with the resolved values.

```ts
import { promiseAllObject } from '@reykjavik/webtools/async';

const { user, posts } = await promiseAllObject({
  user: fetchUser(),
  posts: fetchPosts(),
});
```

---

### `maxWait`

**Syntax:** `maxWait(timeout: number, promises: Array<any>): Promise<void>`  
**Syntax:**
`maxWait<T extends PlainObj>(timeout: number, promises: T): Promise<{ [K in keyof T]: PromiseSettledResult<T[K]> } | undefined }>`

This somewhat esoteric helper resolves soon when all of the passed `promises`
have settled (resolved or rejected), OR after `timeout` milliseconds —
whichever comes first.

If an object is passed, the resolved value will be an object with the same
keys, and any settled values in a `PromiseSettledResult` object, and
`undefined` for any promises that didn't settle in time.

```ts
import { maxWait } from '@reykjavik/webtools/async';

const user = fetchUser(); // Promise<User>
const posts = fetchPosts(); // Promise<Array<Post>>

// Array of promises resolves to void
await maxWait(500, [user, posts]);

// Object of promises resolves to an object with any resolved values at that time
const { user, posts } = await maxWait(500, { user, posts });

console.log(user?.value); // undefined | User
console.log(posts?.value); // undefined | Array<Post>
console.log(posts?.status); // 'fulfilled' | 'rejected'
console.log(posts?.reason); // undefined | unknown
```

---

## `@reykjavik/webtools/errorhandling`

A small set of lightweight tools for handling errors and promises in a safer,
more structured, FP-ish way.

Errors are always the first return value to promote early, explicit error
handling.

### `asError`

**Syntax:** `asError(maybeError: unknown): ErrorFromPayload`

Guarantees that a caught (`catch (e)`) value of `unknown` type, is indeed an
`Error` instance.

If the input is an `Error` instance, it is returned as-is. If the input is
something else it is wrapped in a new `ErrorFromPayload` instance, and the
original value is stored in as a `payload` property.

```ts
import { asError, type ErrorFromPayload } from '@reykjavik/webtools/errorhandling';

const theError = new Error('Something went wrong');
try {
  throw theError;
} catch (err) {
  const error = asError(theError);
  console.error(error === theError); // true
  console.error('patload' in error); // false
}

const someObject = ['Something went wrong'];
try {
  throw someObject;
} catch (err) {
  const error = asError(someObject);
  console.error(error === someObject); // false
  console.error(error.message === someObject.join(',')); // false
  console.error(error instanceOf ErrorFromPayload); // true

  console.error(error.payload === someObject); // true
}
```

### `Result` Singleton

Singleton object with the following small methods for creating, mapping or
handling `ResultTupleObj` instances:

- `Result.Success`
- `Result.Fail`
- `Result.catch`
- `Result.map`
- `Result.throw`

### Type `ResultTuple`

**Syntax:** `ResultTuple<ResultType, OptionalErrorType>`

(Also aliased as `Result.Tuple`)

Simple bare-bones discriminated tuple type for a `[error, result]` pair.

```ts
import { type ResultTuple } from '@reykjavik/webtools/errorhandling';

declare const myResult: ResultTuple<string, Error>;

const [error, result] = myResult;
// (One of these two is always `undefined`)

if (error) {
  // Here `error` is an Error instance
  console.error(error.message);
} else {
  // Here `result` is guaranteed to be a string
  console.log(result);
}
```

### Type `ResultTupleObj`

**Syntax:** `ResultTupleObj<ResultType, OptionalErrorType>`

(Also aliased as `Result.TupleObj`)

Discriminated tuple type for a `[error, result]` pair (same as `ResultTuple`)
but with named properties `error` and `result` attached for dev convenience.

```ts
import { type ResultTuple } from '@reykjavik/webtools/errorhandling';

declare const myResult: ResultTuple<string, Error>;

const [error, result] = myResult;
// (One of these two is always `undefined`)

if (error) {
  // Here `error` is an Error instance
  console.error(error.message);
} else {
  // Here `result` is guaranteed to be a string
  console.log(result);
}

// But `myResults` also has named properties, for convenience
if (myResult.error) {
  // Here `myResult.error` is an Error instance
  console.error(myResult.error.message);
} else {
  // Here `myResult.result` is a string
  console.log(myResult.result);
}
```

### `Result.catch`

**Syntax:**
`Result.catch<T, Err>(callback: () => T): ResultTupleObj<T, Err>`  
**Syntax:**
`Result.catch<T, Err>(promise: Promise<T>): Promise<ResultTupleObj<T, Err>>`

Error handling utility that wraps a promise or a callback function.

Catches errors and returns a `ResultTupleObj` — a nice discriminated
`[error, results]` tuple with the `result` and `error` also attached as named
properties.

Works on both promises and sync callback functions.

```ts
import { Result } from '@reykjavik/webtools/errorhandling';

// Callback:
const [error, fooObject] = Result.catch(() => getFooSyncMayThrow());
// Promise:
const [error, fooObject] = await Result.catch(getFooPromiseMayThrow());

// Example of object property access:
const fooQuery = await Result.catch(getFooPromiseMayThrow());
if (fooQuery.error) {
  console.log(fooQuery.error === fooQuery[0]); // true
  throw fooQuery.error;
}
console.log(fooQuery.result === fooQuery[1]); // true
fooQuery.result; // Guaranteed to be defined
```

This function acts as the inverse of [`Result.throw()`](#resultthrow).

### `Result.map`

**Syntax:**
`Result.map<T, T2, E>(result: ResultTuple<T, E>, mapResult: (resultValue: T) => T2): ResultTuple<T2, E>`

Helper to map a `ResultTuple`-like object to a new `ResultTupleObj` object,
applying a transformation function to the result, but retaining the error
as-is.

```ts
import { Result } from '@reykjavik/webtools/errorhandling';

const getStrLength = (str: string) => str.length;

const resultTuple =
  Math.random() < 0.5 ? [new Error('Fail')] : [undefined, 'Hello!'];

const [error, mappedResult] = Result.map(resultTuple, getStrLength);

if (result) {
  console.log(result); // 6
}
```

### `Result.Success`

**Syntax:** `Result.Success<T>(result: T): ResultTuple<T>`

Factory for creating a successful `ResultTupleObj`.

```ts
import { Result } from '@reykjavik/webtools/errorhandling';

const happyResult: Result.SuccessObj<string> =
  Result.Success('My result value');

console.log(happyResult.error); // undefined
console.log(happyResult[0]); // undefined
console.log(happyResult.result); // 'My result value'
console.log(happyResult[1]); // 'My result value'
```

### `Result.Fail`

**Syntax:** `Result.Fail<E extends Error>(err: T): ResultTuple<unknown, Err>`

Factory for creating a failed `ResultTupleObj`.

```ts
import { Result } from '@reykjavik/webtools/errorhandling';

const happyResult: Result.FailObj<string> = Result.Fail(new Error('Oh no!'));

console.log(happyResult.error.message); // 'Oh no!'
console.log(happyResult[0].message); // 'Oh no!'
console.log(happyResult.result); // undefined
console.log(happyResult[1]); // undefined
```

### `Result.throw`

**Syntax:** `Result.throw<T>(result: ResultTuple<T>): T`

Unwraps a discriminated `ResultTuple`-like `[error, result]` tuple and throws
if there's an error, but returns the result otherwise.

```ts
import { Result } from '@reykjavik/webtools/errorhandling';

try {
  const fooResults = Result.throw(await getFooResultsTuple());
} catch (fooError) {
  // Do something with the error from `getFooResultsTuple()`
}
```

This function acts as the inverse of [`Result.catch()`](#resultcatch).

---

## `@reykjavik/webtools/SiteImprove`

Contains React helpers for loading SiteImprove's analytics scripts, and
perform page-view and custom event tracking in applications with client-side
(`pushState`) routing.

### `SiteImprove` component

A component for loading a SiteImprove analytics script and set up page-view
tracking across URL routes.

It also automatically logs all out-bound link clicks, to match the behavior of
the vanilla SiteImprove script.

**Props:**

The Component's props have detailed JSDoc comments (displayed in your code
editor), but there's a brief summary:

- `accountId?: string` — Your SiteImprove account ID. (alternative to
  `scriptUrl` prop).
- `scriptUrl?: string` — The full SiteImprove analytics script URL.
  (alternative to `accountId` prop).
- `hasConsented?: boolean` — Manual GDPR 'analytics' consent flag. Allows hard
  opt-out, but defers to [`CookieHubProvider` values](#usecookiehubconsent) if
  they are available.
- `onLoad?: (e: unknown) => void` — Fires when the script has loaded.
- `onError?: (e: unknown) => void` — Fires if loading the script failed.

Example usage somewhere in your application:

```jsz
import { SiteImprove } from '@reykjavik/webtools/SiteImprove';

const siteImproveAccountId = '[ACCOUNT_ID]'; // e.g. "7654321"

// ...then inside your main App component
<SiteImprove accountId={siteImproveAccountId} />;
```

In dev mode it does NOT load the SiteImprove script and merely logs page-view
events to the console.

### `pingSiteImprove` helper

**Syntax:**
`pingSiteImprove(category: string, action: string, label?: string): void`

A small helper for tracking custom UI events and reporting them to SiteImrove.

It safely manages GDPR consent, so you can use it unconditionally.

```js
import { pingSiteImprove } from '@reykjavik/webtools/SiteImprove';

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
import { pingSiteImproveOutbound } from '@reykjavik/webtools/SiteImprove';

const handleSubmit = () => {
  // perform submit action...
  if (success) {
    const fileUrl = '/download/report.pdf';
    pingSiteImproveOutbound(fileUrl);
    document.location.href = fileUrl;
  }
};
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

## `@reykjavik/webtools/vanillaExtract`

Contains helpers for writing [vanilla-extract](https://vanilla-extract.style)
styles using plain CSS styntax.

This provides an "escape hatch" into regular CSS, when you're willing to trade
local type-safety for access to the full features and expressiveness of real
CSS.
([Background info](https://github.com/vanilla-extract-css/vanilla-extract/discussions/898#discussioncomment-7125457).)

### `vanillaClass`

**Syntax:**
`vanillaClass(css: string | ((className: string, classNameSelector: string) => string)): string`  
**Syntax:**
`vanillaClass(debugId: string, css: string | ((className: string, classNameSelector: string) => string)): string`

Returns a scoped cssClassName styled with free-form CSS. This function is a
thin wrapper around vanilla-extract's `style` function.

When you pass it a string, all `&&` tokens are automatically replaced with the
selector for the auto-generated class-name. Note that in such cases EVERY
style property must be wrapped in a selector block.

To opt out of the `&&` replacement, use the callback function signature.

```ts
// someFile.css.ts
import { vanillaClass } from '@reykjavik/webtools/vanillaExtract';

// Simple class selector block
export const myClass = vanillaClass(`
  background-color: #ccc;
  padding: .5em 1em;
`);

// With && tokens that get replaced with the generated class-name
export const myClasWithAmp = vanillaClass(`
  && {
    background-color: #ccc;
    padding: .5em 1em;
  }
  && > strong {
    color: #c00;
  }
`);

// Passing a function to get the generated class-name for
// more complex styles.
export const myOtherClass = vanillaClass(
  (classNameRaw, classNameSelector) => `
    ${classNameSelector} { 
      background-color: #ccc;
      padding: .5em 1em;
    }
    [class="${classNameRaw}"] > strong {
      color: #c00;
    }
    @media (min-width: 800px) {
      ${classNameSelector} {
        background-color: #eee;
      }
    }
    /* NOTE: '&&' tokens returned from a callback function are NOT replaced */
    && { will-not-be: interpolated; }
  `
);

// With a human readable debugId
export const humanReadableClass = vanillaClass(
  'HumanReadable',
  `
    border: 1px dashed hotpink;
    cursor: pointer;
  `
);
```

(NOTE: The dot-prefixed `&&` pattern is chosen to not conflict with the bare
`&` token in modern nested CSS.)

### `vanillaGlobal`

**Syntax:** `vanillaGlobal(css: string): void`

Inserts free-form CSS as a vanilla-extract `globalStyle`.

```ts
// someFile.css.ts
import { vanillaGlobal } from '@reykjavik/webtools/vanillaExtract';

vanillaGlobal(`
  body {
    background-color: rebeccapurple;
  }
`);
```

### `vanillaProps`

**Syntax:** `vanillaProps(css: string): GlobalStyleRule`

Returns an object that can be safely spread into a vanilla-extract style
object, to inject free-form CSS properties (or nested blocks).

```ts
// someFile.css.ts
import { style } from '@vanilla-extract/css';
import { vanillaProps } from '@reykjavik/webtools/vanillaExtract';

const myStyle = style({
  color: 'darksalmon',
  // ...other style props...

  ...vanillaProps(`
    /* Plain CSS that's injected into the "myStyle" style block */
    border-bottom: 1px solid red;
    color: ${theme.color.primary}; /* I can still use typesafe values */
    random-css-prop-normally-rejected-by-vanilla-extract: 'YOLO!';
  `),
});
```

---

## Framework Specific Tools

### Remix.run Tools

See [README-remix.md](./README-remix.md) for helpers and components
specifically designed for use in Remix.run projects.

<!-- #fragment anchors to not break older v0.1 @see links -->

<a name="reykjavikwebtoolsnexthttp"></a> <a name="makeerrorizeapphoc"></a>
<a name="showerrorpage-helper"></a> <a name="notmodified304-helper"></a>
<a name="reykjavikwebtoolsnextsiteimprove"></a>

### Next.js Tools

See [README-nextjs.md](./README-nextjs.md) for helpers and components
specifically designed for use in Next.js projects.

---

## Contributing

This project uses the [Bun runtime](https://bun.sh) for development (tests,
build, etc.)

PRs are welcome!

---

## Changelog

See
[CHANGELOG.md](https://github.com/reykjavikcity/webtools/blob/main/CHANGELOG.md)
