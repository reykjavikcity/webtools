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
  - [`debounce`](#debounce)
  - [`cachifyAsync`](#cachifyasync)
  - [`throttle`](#throttle)
- [`@reykjavik/webtools/hoooks`](#reykjavikwebtoolshoooks)
  - [`useDebounced`](#usedebounced)
  - [`useThrottled`](#usethrottled)
- [`@reykjavik/webtools/errorhandling`](#reykjavikwebtoolserrorhandling)
  - [`asError`](#aserror)
  - [`Result` Singleton](#result-singleton)
  - [Type `ResultTuple`](#type-resulttuple)
  - [Type `ResultTupleObj`](#type-resulttupleobj)
    - [Type `ResultTupleObj.mapTo`](#type-resulttupleobjmapto)
  - [`Result.catch`](#resultcatch)
  - [`Result.ify`](#resultify)
  - [`Result.map`](#resultmap)
  - [`Result.Success`](#resultsuccess)
  - [`Result.Fail`](#resultfail)
  - [`Result.throw`](#resultthrow)
  - [Type `Result.PayloadOf`](#type-resultpayloadof)
  - [Type `Result.ErrorOf`](#type-resulterrorof)
- [`@reykjavik/webtools/alertsStore`](#reykjavikwebtoolsalertsstore)
  - [`createAlerterStore`](#createalerterstore)
    - [type `AlerterConfig`](#type-alerterconfig)
  - [`@reykjavik/webtools/alertsStore/react`](#reykjavikwebtoolsalertsstorereact)
    - [`makeReactSubscription`](#makereactsubscription)
    - [`renderAlertMessage`](#renderalertmessage)
    - [`renderAlertMessage.withLinkRenderer`](#renderalertmessagewithlinkrenderer)
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
  - [`vanillaVars`](#vanillavars)
- [Framework Specific Tools](#framework-specific-tools)
  - [React-Router Tools](#react-router-tools)
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

const ttlSec1 = toSec(ttl); // 7200
// Raw numbers are returned as-is (rounded)
const ttlSec2 = toSec(10.6); // 11
// Negative numbers become zero
const ttlSec3 = toSec('-1h'); // 0
```

### `toMs` duration helper

**Syntax:**
`` toSec(duration: number | `${number}${'s'|'m'|'h'|'d'|'w'}`): number ``

Converts a `TTL` (duration) value into milliseconds. Returns `0` for bad
and/or negative input values.

```js
import type { toMs, TTL } from '@reykjavik/webtools/http';

const ttl: TTL = '2h';

const ttlMs1 = toMs(ttl); // 7_200_000
// Raw numbers are returned as-is (rounded)
const ttlMs2 = toMs(499.9); // 500
// Negative numbers become zero
const ttlMs3 = toMs('-1h'); // 0
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

- The `style: "unit"` option is not supported and prints units in Danish. (So,
  so (!!) many units and unit-variants… Impractical to handle size-wise.)
- The `currencyDisplay: "name"` option is not supported and prints the
  currency's full name in Danish. (Impractical to handle size-wise.)

**`Intl.DateTimeFormat` and `toLocaleDateString`:**

- The `month: 'narrow'` and `weekday: 'narrow'` options are not supported, and
  print the corresponding Danish initials. (Near impossible to patch because
  the Danish initials are ambigious)
- For `timeZoneName` the values `"long"`, `"shortGeneric"` and `"longGeneric"`
  will appear in Danish. (Impractical to handle size-wise.)
- The `timeStyle: 'full'` option prints the timezone names in Danish
- The `dayPeriod` option has a couple of slight mismatches, at 5 am and 12
  noon. (Completely harmless.)

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

### `debounce`

**Syntax:**
`debounce<A extends Array<unknown>>(func: (...args: A) => void, delay: number, immediate?: boolean): ((...args: A) => void) & { cancel: (finish?: boolean) => void; }`

Returns a debounced function that only runs after `delay` milliseconds of
quiet-time, and can optionally be made to run `immediate`ly on first call
before dbouncing subsequent calls.

```ts
import { debounce } from '@reykjavik/webtools/async';

// Basic usage:
const sayHello = debounce((namme: string) => {
  console.log('Hello ' + name);
}, 200);

sayHello('Alice');
sayHello('Bob');
sayHello('Charlie');
sayHello('Dorothy');
// Only "Hello Dorothy" is logged, 200ms after the last call

// With `immediate` param set to true:
const sayHi = debounce(
  (namme: string) => console.log('Hi ' + name),
  200,
  true
);
sayHi('Alice');
sayHi('Bob');
sayHi('Charlie');
sayHi('Dorothy');
// "Hi Alice" is logged immediately
// Then "Hi Dorothy" is logged, 200ms after the last call
```

The returned function has a nice `.cancel()` method, which can optionally
invoke the function before cancelling, if it had a debounce pending.

```ts
sayHello('Erica');
sayHello('Fiona');
sayHello.cancel();
// Nothing is logged because the debounce was cancelled

sayHello('George');
sayHello('Harold');
sayHello.cancel(true); // `finish` parmeter is true
// "Hello Harold" is logged immediately because it was pending
```

---

### `cachifyAsync`

**Syntax:**
`cachifyAsync<R, F extends (...args: any[]) => Promise<Result.TupleObj<R>>>(opts: { fn: F; ttl: TTL; throttle?: TTL; customTtl?: (args: Parameters<F>, result: Result.TupleObj<R>) => TTL | undefined; getKey?: (...args: Parameters<F>) => string; returnStale?: boolean }): F`

Wraps an async function with a simple, robust caching layer. Returns a
function with the same signature as `fn`, but with caching applied.

The caching strategy is simple. If `fn` resolves to an error result, the error
is cached for a short time (default: `30s`) to avoid hammering the underlying
function, and a stale (last successful) result is returned if available. The
error result is only while waiting for the issue to be resolved. Return stale
(last successful) result while throttling.

- No max size or eviction strategy—intended for caching a small, clearly
  bounded number of different cache "keys" (e.g. per language).

**Options:**

- `fn: <T>(...args: ay[]) => Promise<Result.TupleObj<T>>` — The async function
  to cache.
- `ttl: TTL` — How long to cache successful results. Number values are treated
  as seconds. (See (`TTL` type)[#type-ttl]).
- `throttle? TTL` — The minimum time between retries for error results.
  Numbers are treated as seconds.
- `customTtl?: (args: Parameters<typeof fn>, result: Result.TupleObj<T>) => TTL | undefined;`
  — set a custom TTL on success and/or error results. Return `undefined` to
  use the default `ttl`/`throttle` values.
- `getKey?: (...args: Parameters<typeof fn>) => string` — Creates a custom
  cache key for the current result set. Default: `JSON.stringify(args)`.
- `returnStale?: boolean` — Whether to return stale (last successful) result
  when `fn` resolves to an error result. Defaults to `true`.

**Example:**

```ts
import { cachifyAsync } from '@reykjavik/webtools/async';
import { Result } from '@reykjavik/webtools/errorhandling';

const fetchUser = async (id: string) =>
  Result.ify(fetch(`/api/user/${id}`).then((r) => r.json()));

const cachedFetchUser = cachifyAsync({
  fn: fetchUser,
  ttl: '10m',
});

// ---------------------****---------------------------------------
// Usage:

const result = await cachedFetchUser('123');

if (result.error) {
  // handle error
} else {
  // use result.result
}
```

---

### `throttle`

**Syntax:**
`throttle<A extends Array<unknown>>(func: (...args: A) => void, delay: number, skipFirst?: boolean): ((...args: A) => void) & { finish: (cancel?: boolean) => void; }`

Returns a throttled function that never runs more often than every `delay`
milliseconds. It can optionally made to `skipFirst` invocation.

```ts
import { throttle } from '@reykjavik/webtools/async';

// Basic usage:
const sayHello = throttle((name: string) => {
  console.log('Hello ' + name);
}, 200);

sayHello('Alice');
sayHello('Bob');
sayHello('Charlie');
sayHello('Dorothy');
// Only "Hello Alice" is logged immediately. The other calls were throttled.

// With `skipFirst` param set to true:
const sayHi = throttle(
  (name: string) => console.log('Hi ' + name),
  200,
  true
);
sayHi('Alice');
sayHi('Bob');
sayHi('Charlie');
sayHi('Dorothy');
// Nothing is logged. The first call was skipped, and the rest were throttled.
```

The returned function also has a nice `.finish()` method to reset the throttle
timer. By default it instantly invokes the function, if the last call was
throttled (skipped)-.

```ts
sayHello('Erica');
sayHello('Fiona');
sayHello.finish();
// "Hello Fiona" is logged immediately because it was pending

sayHello('George');
sayHello('Harold');
sayHello.finish(true); // `cancel` parmeter is true
// Nothing is logged because the pending call was cancelled
```

---

## `@reykjavik/webtools/hoooks`

Some useful React hooks.

### `useDebounced`

**Syntax:**
`useDebounced<A extends Array<unknown>>(func: (...args: A) => void, delay: number, immediate?: boolean): ((...args: A) => void) & { cancel: (finish?: boolean) => void; }`

Returns a stable debounced function that invokes the supplied function after
the specified delay. When the component unmounts, any pending (debounced)
calls are automatically cancelled.

**NOTE:** The supplied callback does not need to be memoized. The debouncer
will always invoke the last supplied version.

```ts
import { useDebounced } from '@reykjavik/webtools/hoooks';

const MyComponent = () => {
  const renderDate = new Date();
  const debouncedSearch = useDebounced((query: string) => {
    console.log('Searching for:', query, 'at', renderDate.toISOString());
  }, 200);
  return (
    <input
      type="text"
      onChange={(e) => {
        debouncedSearch(e.currentTarget.value);
      }}
    />
  );
};
```

See [`debounce`](#debounce) for more details about the parameters and the
returned debounced function's `.cancel()` method.

### `useThrottled`

**Syntax:**
`useThrottled<A extends Array<unknown>>(func: (...args: A) => void, delay: number, skipFirst?: boolean): ((...args: A) => void) & { finish: (cancel?: boolean) => void; }`

Returns a stable throttler function that throttles the supplied function.

**NOTE:** The supplied callback does not need to be memoized. The throttler
will always invoke the last supplied version.

```ts
import { useThrottled } from '@reykjavik/webtools/hoooks';

const MyComponent = () => {
  const renderDate = new Date();
  const throttledReportPosition = useThrottled((x: number, y: number) => {
    console.log('Mouse position:', x, ',', y, 'at', renderDate.toISOString());
  }, 200);

  return (
    <div
      style={{ width: '300px', height: '300px', background: '#eee' }}
      onMouseMove={(e) => {
        throttledReportPosition(e.clientX, e.clientY);
      }}
    >
      Move your mouse here.
    </div>
  );
};
```

See [`throttle`](#throttle) for more details about the parameters and the
returned throttled function's `.finish()` method.

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
original value is stored in as a `payload` property, and it's `.toString()` is
used for the `message` property.

```ts
import { asError, type ErrorFromPayload } from '@reykjavik/webtools/errorhandling';

const theError = new Error('Something went wrong');
try {
  throw theError;
} catch (err) {
  // theError is an instance of Error so it's returned as-is
  const error = asError(theError);
  console.error(error === theError); // true
  console.error('payload' in error); // false
}

const someObject = ['Oops', 'Something went wrong'];
try {
  throw someObject;
} catch (err) {
  // the thrown someObject is not an Error so an `ErrorFromPayload` is returned
  const error = asError(someObject);
  console.error(error === someObject); // false
  console.error(error instanceOf ErrorFromPayload); // true

  console.error(error.payload === someObject); // true
  console.error(error.message === someObject.join(',')); // true
}
```

### `Result` Singleton

Singleton object with the following small methods for creating, mapping or
handling `ResultTupleObj` instances:

- `Result.Success`
- `Result.Fail`
- `Result.catch` / `Result.ify`
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

It also has a `.mapTo` method ([see below](#type-resulttupleobjmapto)).

```ts
import { type ResultTupleObj } from '@reykjavik/webtools/errorhandling';

declare const myResult: ResultTupleObj<string, Error>;

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

#### Type `ResultTupleObj.mapTo`

**Syntax:**
`ResultTupleObj.mapTo<T2, E>(mapResult: (resultValue: T) => T2): ResultTuple<T2, E>`

This convenience method allows quick mapping of the `ResultTubleOBj`'s result
value to a new type. The returned value is also a `ResultTubleOBj`.

(Internally this method calls [`Result.map`](#resultmap).)

```ts
import { type ResultTuple } from '@reykjavik/webtools/errorhandling';

declare const myResult: ResultTuple<string, Error>;

const mappedResult: ResultTupleObj<number, Error> = myResult.mapTo(
  (result: string) => result.length
);

if (mappedRes.error) {
  console.error(myResult.error.message);
} else {
  // Here `myResult.result` is a number
  console.log(myResult.result);
}
```

If the original `ResultTupleObj` is in a failed state, the mapping function is
not called.

If the mapping function throws an error it gets caught and turned into a
failed `ResultTupleObj`.

### `Result.catch`

Aliased as `Result.ify` for readability.

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

### `Result.ify`

Syntatic sugar alias of [`Result.catch`](#resultcatch).

### `Result.map`

**Syntax:**
`Result.map<T, T2, E>(result: ResultTuple<T, E>, mapResult: (resultValue: T) => T2): ResultTuple<T2, E>`

Convenience helper to map a `ResultTuple`-like object to a new
`ResultTupleObj` object, applying a transformation function to the result, but
retaining the error as-is. Errors thrown from the mapping function are caught
and turned into a failed `ResultTupleObj`.

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

### Type `Result.PayloadOf`

**Syntax:**
`Result.PayloadOf<T extends | ResultTuple<unknown> | Promise<ResultTuple<unknown>> | ((...args: Array<any>) => ResultTuple<unknown> | Promise<ResultTuple<unknown>>)>`

This utility type extracts the successful payload type `T` from a
`Result.Tuple<T>`-like type, a `Promise` of such type, or a function returning
either of those.

```ts
import { Result } from '@reykjavik/webtools/errorhandling';

type ResTpl = Result.Tuple<string, Error>;
type ResTplPromise = Promise<Result.Tuple<number, Error>>;
type ResTplFn = (arg: unknown) => Result.Tuple<boolean, Error>;
type ResTplPromiseFn = (
  arg: unknown
) => Promise<Result.TupleObj<Date, Error>>;

type Payload1 = Result.PayloadOf<ResTpl>; // string
type Payload2 = Result.PayloadOf<ResTplPromise>; // number
type Payload3 = Result.PayloadOf<ResTplFn>; // boolean
type Payload4 = Result.PayloadOf<ResTplPromiseFn>; // Date
```

NOTE: This type also works for [`ResultTupleObj`](#type-resulttupleobj) as
it's a subtype of `ResultTuple`.

---

### Type `Result.ErrorOf`

**Syntax:**
`Result.ErrorOf<T extends | ResultTuple<unknown> | Promise<ResultTuple<unknown>> | ((...args: Array<any>) => ResultTuple<unknown> | Promise<ResultTuple<unknown>>)>`

This utility type extracts the error type `E` from a `Result.Tuple<T>`-like
type, a `Promise` of such type, or a function returning either of those.

```ts
import { Result } from '@reykjavik/webtools/errorhandling';

type ResTpl = Result.Tuple<string, RangeError>;
type ResTplPromise = Promise<Result.Tuple<number, RangeError>>;
type ResTplFn = (arg: unknown) => Result.Tuple<boolean, RangeError>;
type ResTplPromiseFn = (
  arg: unknown
) => Promise<Result.TupleÞObj<Date, RangeError>>;

type Error1 = Result.ErrorOf<ResTpl>; // RangeError
type Error2 = Result.ErrorOf<ResTplPromise>; // RangeError
type Error3 = Result.ErrorOf<ResTplFn>; // RangeError
type Error4 = Result.ErrorOf<ResTplPromiseFn>; // RangeError
```

NOTE: This type also works for [`ResultTupleObj`](#type-resulttupleobj) as
it's a subtype of `ResultTuple`.

---

## `@reykjavik/webtools/alertsStore`

A small JS alerts store for toasts and other global UI feedback messages.

Persists alerts to `sessionStorage` to survive browser reloads, and provides a
simple pub/sub API for components to subscribe to alert changes.

### `createAlerterStore`

**Syntax:**
`createAlerterStore(cfg?: AlerterConfig): { alerter: Record<Level, (payload: AlertPayload>) => void, subscribe: (callback: (alerts: Array<AlertInfo>, meta: { type: EventType, ids: Array<string> }) => void) => unsubscribe() => void; }`

Factory function that instantiates a new alerter store and returns a strongly
typed object with the following properties:

- `alerter`: A singleton object with methods for dispatching new alerts of
  different levels. Pass a payload object to the method of the level you want
  to dispatch, and the alert will be added to the store.
- `subscribe`: A function for subscribing to alert changes. It accepts a
  callback that gets called with the current list of alerts and some metadata
  whenever an alert is added or cleared.  
  The callback is called immediately upon subscription if there are already
  active alerts.  
  It returns an unsubscribe function to stop receiving updates.

Simple useage with default settings:

```ts
// ---------------------------------------------------------------------------
// alerterStore.ts
// ---------------------------------------------------------------------------

import { createAlerterStore } from '@reykjavik/webtools/alertsStore';
import type { InferSubscriberAlerts, InferAlerterPayload } from '@reykjavik/webtools/alertsStore';

const { alerter, subscribe } = createAlerterStore();

export { alerter, subscribe };
export type AlertPayload = InferAlerterPayload(typeof alerter);
export type AlertInfo = InferSubscriberAlerts<typeof subscribe>;

// ---------------------------------------------------------------------------
// appRoot.ts
// ---------------------------------------------------------------------------

import { subscribe } from '../alerterStore';

const unsubscribe = subscribe((alerts, meta) => {
  console.log('Current alerts:', alerts);
  console.log('Change type:', meta.type);
  console.log('Affected alert IDs:', meta.ids);
});

// Stop receiving updates after 1 hour
setTimeout(unsubscribe, 3_600_000);

// ---------------------------------------------------------------------------
// someOtherModule.ts
// ---------------------------------------------------------------------------

import { alerter } from '../alerterStore';
alerter.success({
  message: 'All is good',
  // type: 'something',
  // flags: ['pristine'],
  duration: 'MEDIUM',
  delay: 500, // Optional delay
});
// after 500ms the above alert is added to the store, and all subscribers
// are notified. The subscriber in `appRoot.ts` will log the following;
/*
  Current alerts: [
    {
      id: '_234566-27_', // autugenerated
      level: 'success',
      message: 'All is good',
      duration: 5000, // ms
      dismiss: <Function>,
      setFalgs: <Function>,
    }
  ]
  Change type: 'add'
  Affected alert IDs: ['_234566-27_']
*/
```

Note how the `AlertPayload` and `AlertInfo` types are inferred from the
generated `alerter` and the `subscribe` functions, respectively, using the
provided `InferAlerterPayload` and `InferSubscriberAlerts` utility types.

#### type `AlerterConfig`

The `createAlerter` function accepts an optional configuration object that
allows the customization of all of the accepted alert values and durations.

The configuration values affect the type signatures of the generated `alerter`
and the `subscribe` functions. (See `InferAlerterPayload` and
`InferSubscriberAlerts` below)

The configuration options are as follows:

- **`key?: string`**  
  Identifier for the alerts store, used to create the key to persist alerts in
  `sessionStorage` (or other provided storage).  
  Required if you want to have multiple independent alert stores in the same
  application.  
  Default: `'app-alerts'`.

- **`levels?: Array<string>`**  
  The accepted alert levels. The returned `alerter` object has a named
  dispatcher method for each level.  
  Default: `['success', 'info', 'warning', 'error']`.

- **`types?: Array<string>`**  
  The allowed alert "types", which can be used to, for example, dispatch both
  "toasts" vs. "static alert banners" via the same store.  
  This can also be used for more basic styling or categorization purposes.  
  Default: no restrictions, any string value is allowed.

- **`flags?: Array<string>`**  
  The allowed alert "flags", which can be changed during the lifetime of an
  alert using the `setFlags` function on the `AlertInfo` object.  
  This can be used for styling or any other purpose you like.  
  Default: no restriction, any string value is allowed.

- **`durations?: Record<string, number>`**  
  The allowed alert "duration" names and their lengths in milliseconds.
  Default:
  `{ BLINK: 2_000, SHORT: 4_000, MEDIUM: 8_000, LONG: 16_000, XLONG: 32_000, INDEFINITE: 0 }`.

- **`defaultDuration?: string`**  
  The duration to use for alerts if no duration is specified when
  dispatching.  
  Default: `SHORT` if using the default durations, otherwise the default is
  `0` (indefinite)

- **`storage?: Pick<Storage, 'getItem' | 'setItem'>`**  
  The storage object to use instead of `sessionStorage` (the default) for
  persisting alerts across page reloads, etc.

### `@reykjavik/webtools/alertsStore/react`

#### `makeReactSubscription`

**Syntax:**
`makeReactSubscription(): { useAlerter: () => Array<AlertInfo>, AlertsContainer: (props: { children: (alerts: Array<alertInfo>) => ReactNode }) => ReactNode }`

Factory function that creates a React subscription hook and a container
component linked to a specific alerter store subscibe function.

The returned `useAlerter` hook can be used in any React component to get the
current list of alerts from the store

Meanwhile the `AlertsContainer` is a sugar component that calls `useAlerter()`
internally and provides the current alerts list to its child as a render prop.

The returned list and its items and their properties are all immutable/stable
so you can safely use them as dependencies in React hooks, etc.

```ts
// ---------------------------------------------------------------------------
// alerterStore.ts
// ---------------------------------------------------------------------------

import { createAlerterStore } from '@reykjavik/webtools/alertsStore';
import { makeReactSubscription } from '@reykjavik/webtools/alertsStore/react';

const { alerter, subscribe } = createAlerterStore();

export { alerter };
export const { useAlerter, AlertsContainer } =
  makeReactSubscription(subscribe);

// ---------------------------------------------------------------------------
// app.tsx
// ---------------------------------------------------------------------------

import { AlertsContainer } from '../alerterStore';
import { Toast } from '../components/Toast';

// In your App JSX
<AlertsContainer>
  {(alerts) => (
    <div class="toastcontainer">
      {alerts.map((alert) => (
        <Toast key={alert.id} {...alert} />
      ))}
    </div>
  )}
</AlertsContainer>;
```

#### `renderAlertMessage`

**Syntax:**
`renderAlertMessage(message: AlertInfo['message'], onLinkClick?: (e: MouseEvent) => void, linkComponent?: renderAlertMessage.LinkRenderer): ReactNode`

Helper to render an alerter alert message, which can be a simple string or a
more complex array of strings and objects representing links and rich (bold)
text formatting.

You can optionally pass an additional `onLinkClick` handler as a second
parameter. (For example the alert's `dismiss` dispatcher.)

It renders link objects as simple `<a href="" />` elements, by default, but
you can optionally provide a custom `linkComponent` as a third parameter.

Third

```ts
import { renderAlertMessage } from '@reykjavik/webtools/alertsStore/react';
import Link from 'next/link';

import { AlertInfo } from '../alertsStore';

export const Toast = (props: AlertInfo) => (
  <div class="toast">
    {renderAlertMessage(props.message, Link, props.dismiss)}
  </div>
);
```

To build your own custom `LinkComponent`, you can use the
`renderAlertMessage.LinkRenderer` type for the function signature.

```ts
import { renderAlertMessage } from '@reykjavik/webtools/alertsStore/react';
import { Link } from 'react-router';

const MyWrappedLink: renderAlertMessage.LinkRenderer = (props) => {
  const { href, ...linkProps } = props;
  return <Link to={href} {...linkProps} />;
};

// Then elsewhere in your Alert/Toast component
<div class="toast__message">
  {renderAlertMessage(props.message, MyWrappedLink, props.dismiss)};
</div>;
```

Alternatively, if you want to avoid passing the `LinkComponent` every time you
call `renderAlertMessage`, you can use the
`renderAlertMessage.withLinkRenderer` helper

#### `renderAlertMessage.withLinkRenderer`

**Syntax:**
`renderAlertMessage.withLinkRenderer(LinkComponent: renderAlertMessage.LinkRenderer): (message: AlertInfo['message'], onLinkClick?: (e: MouseEvent) => void):ReactNode`

It returns a curried version of [`renderAlertMessage`](#renderAlertMessage)
that uses the passed `LinkComponent` for rendering links in alert messages.

```ts
const curriedRenderAlertMessage =
  renderAlertMessage.withLinkRenderer(MyWrappedLink);

// Then elsewhere in your Alert/Toast component
<div class="toast__message">
  {renderAlertMessage(props.message, props.dismiss)};
</div>;
```

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
- `hasConsented?: boolean` — Manual GDPR 'analytics' consent flag. A `false`
  value allows hard opt-out, but defers to
  [`CookieHubProvider` values](#usecookiehubconsent) if they are available.
  Defaults to `undefined` which means "ask CookieHub if available, otherwise
  no".
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

- `accountId?: string | undefined` — Your CookieHub account ID. (alternative
  to `scriptUrl` prop). Pass `undefined` to skip loading the script.
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

// 1) Simple class selector block — no sub-selectors — auto-wrapped
// in a class-name selector block.
export const myClass = vanillaClass(`
  background-color: #ccc;
  padding: .5em 1em;
`);
// Generated CSS:
/*
  .x1y2z3 {
    background-color: #ccc;
    padding: .5em 1em;
  }
*/

// ---------------------------------------------------------------------------

// 2) More advanced usage with `&&` tokens that get replaced with the
// generated class-name selector (prefixed with a dot).
export const myClasWithAmp = vanillaClass(
  `
  && {
    background-color: #ccc;
    padding: .5em 1em;
  }
  && > strong {
    color: #c00;
  }
  @media (min-width: 800px) {
    && {
      background-color: #eee;
    }
  }
  /* NOTE: Root-level CSS rules are NOT auto-wrapped when ` &&
    ` tokens are otherwise present */
  color: blue;
`
);
// Generated CSS:
/*
  .y2X1z3 {
    background-color: #ccc;
    padding: .5em 1em;
  }
  .y2X1z3 > strong {
    color: #c00;
  }
  @media (min-width: 800px) {
    .y2X1z3 {
      background-color: #eee;
    }
  }
  /* NOTE: Root-level CSS rules are NOT auto-wrapped when `&&` tokens are otherwise present *​/
  color: blue;
*/

// ---------------------------------------------------------------------------

// 3) Advanced use: Pass a function to get the raw generated class-name,
// plus a more convenient dot-prefixed selector for the class-name.
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
    && { this-is-not: interpolated; }
  `
);
// Generated CSS:
/* 
  .y3z1X2 {
    background-color: #ccc;
    padding: .5em 1em;
  }
  [class="y3z1X2"] > strong {
    color: #c00;
  }
  @media (min-width: 800px) {
    .y3z1X2 {
      background-color: #eee;
    }
  }
  /* NOTE: '&&' tokens returned from a callback function are NOT replaced *​​/
  && { this-is-not: interpolated; }
*/

// ---------------------------------------------------------------------------

// 4) ...with a human readable debugId
export const humanReadableClass = vanillaClass(
  'HumanReadable__classNamePrefix',
  `
    border: 1px dashed hotpink;
    cursor: pointer;
  `
);
// Generated CSS:
/*
  .HumanReadable__classNamePrefix_x2y1z3 {
    border: 1px dashed hotpink;
    cursor: pointer;
  }
*/
```

(NOTE: The dot-prefixed `&&` pattern was chosen as to not conflict with the
bare `&` token in modern nested CSS.)

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

### `vanillaVars`

**Syntax:**
`` vanillaVars(...varNames: Array<T>): Record <`var${Capitalize<T>}`, string> & { setVars: (Partial<Record<`var${Capitalize<T>}`, unknown>>) => string} ``

Returns an object with privately scoped CSS variables props. Pass them around
and use them in your CSS.

The object also has a `setVars` method for generating a CSS string that sets
all or some of the variables in CSS, without offending VSCode's CSS syntax
parser too much.

```ts
// MyComponent.css.ts
import {
  vanillaVars,
  vanillaGlobal,
} from '@reykjavik/webtools/vanillaExtract';

const { varPrimaryColor, varSecondaryColor, setVars } = vanillaVars(
  'primaryColor',
  'secondaryColor'
);

export { varPrimaryColor, varSecondaryColor };

export const wrapper = vanillaClass(`
  ${setVars({
    primaryColor: '#ff0000',
    secondaryColor: '#00ff00',
  })}
  background-color: var(${varPrimaryColor});
  color: var(${varSecondaryColor});
 `);
```

…and then in your component:

```ts
// MyComponent.tsx
import React from 'react';
import * as cl from './someFile.css.ts';

export function MyComponent() {
  return (
    <div
      className={cl.wrapper}
      style={{
        [cl.varPrimaryColor]: 'yellow',
        [cl.varSecondaryColor]: 'blue',
      }}
    >
      ...children...
    </div>
  );
}
```

---

## Framework Specific Tools

### React-Router Tools

See [README-rr.md](./README-rr.md) for helpers and components specifically
designed for use in React-router projects.

(NOTE: If you're still using [Remix.run](https://remix.run) you can install
version `"^0.1.22"` of this package.)

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
