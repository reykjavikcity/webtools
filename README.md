# @reykjavik/webtools

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
    - [Type `TTLConfig`](#type-ttlconfig)
  - [`toSec` TTL helper](#tosec-ttl-helper)
- [`@reykjavik/webtools/CookieHubConsent`](#reykjavikwebtoolscookiehubconsent)
  - [`CookieHubProvider` component](#cookiehubprovider-component)
  - [`useCookieHubConsent`](#usecookiehubconsent)
- [`@reykjavik/webtools/vanillaExtract`](#reykjavikwebtoolsvanillaextract)
  - [`vanillaGlobal`](#vanillaglobal)
  - [`vanillaProps`](#vanillaprops)
  - [`vanillaClass`](#vanillaclass)
  - [`vanillaClassNested`](#vanillaclassnested)
  - [`vanillaNest`](#vanillanest)
- [`@reykjavik/webtools/fixIcelandicLocale`](#reykjavikwebtoolsfixicelandiclocale)
  - [Limitations](#limitations)
- [Framework Specific Tools](#framework-specific-tools)
  - [Next.js Tools](#nextjs-tools)
- [Contributing](#contributing)
- [Changelog](#changelog)

<!-- prettier-ignore-end -->

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

**Syntax:**
`` toSec; (ttl: number | `${number}${'s'|'m'|'h'|'d'|'w'}`) => number ``

Converts a `TTL` (max-age) value into seconds, and returns `0` for bad and/or
negative input values.

```js
import type { toSec, TTL } from '@reykjavik/webtools/http';

const ttl: TTL = '2h';

const ttlSec = toSec(ttl);
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

### `vanillaGlobal`

**Syntax:** `vanillaGlobal: (css: string) => void`

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

**Syntax:** `vanillaProps: (css: string) => GlobalStyleRule`

Spreads the return value into a style object, to inject free-form CSS
properties (or nested blocks)

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

### `vanillaClass`

**Syntax:** `vanillaClass: (css: string) => string`  
**Syntax:** `vanillaClass: (debugId: string, css: string) => string`

Returns a scoped cssClassName styled with free-form CSS. This function is a
thin wrapper around vanilla-extract's `style` function.

```ts
// someFile.css.ts
import { vanillaClass } from '@reykjavik/webtools/vanillaExtract';

export const myClass = vanillaClass(`
  background-color: #ccc;
  padding: .5em 1em;
`);

export const humanReadableClass = vanillaClass(
  'HumanReadable',
  `
    border: 1px dashed hotpink;
    cursor: pointer;
  `
);
```

### `vanillaClassNested`

**Syntax:** `vanillaClassNested: (css: string) => string`  
**Syntax:** `vanillaClassNested: (debugId: string, css: string) => string`

Returns a scoped cssClassName styled with free-form CSS.

It also automatically replaces all `&`-tokens with the selector for the
auto-generated class-name.

```ts
// someFile.css.ts
import { vanillaClassNested } from '@reykjavik/webtools/vanillaExtract';

export const myClass = vanillaClassNested(`
  background-color: #ccc;
  padding: .5em 1em;

  /* Nested blocks begin: */
  &:hover {
    background-color: #666;
    color: white;
  }
  & > strong {
    color: maroon;
  }
  html[data-color-theme="unicorn"] & {
    background-color: pink;
  }
`);
```

**NOTE:** All "bare" (un-nested) style properties **must come first**, before
any nested blocks.

**NOTE 2:** `vanillaClassNested` does NOT support deeply nested blocks, or
anything so fancy. It will also replace `&` characters inside values,
comments, etc. If you need something more sophisticated, use a custom
`postcss` config.

### `vanillaNest`

**Syntax:** `vanillaNest: (ampSelector: string, css: string) => string`

Replaces all `&` tokens with the given selector string, in a direct (read.
"dumb") way. It's mainly useful when used with style-mixins, etc.

`vanillaNest` does NOT support deeply nested blocks, or anything so fancy. It
will also replace `&` characters inside values, comments, etc. If you need
something more sophisticated, use a custom `postcss` config.

```ts
// someCssHelper.ts
import { vanillaNest } from '@reykjavik/webtools/vanillaExtract';

export const hoverGlow = (
  ampSelector: string,
  glowiness?: 'normal' | 'insane'
) =>
  vanillaNest(
    ampSelector,
    `
    &:hover {
      box-shadow: 0 0 20px 5px ${
        glowiness === 'insane' ? 'hotpink' : 'salmon'
      };
    }
  `
  );

// ...then, somewhere else in a *.css.ts file:

import { hoverGlow } from '~/someCssHelper.js';
import { vanillaGlobal } from '@reykjavik/webtools/vanillaExtract';

vanillaGlobal(`
  .MyComponent {
    border: 1px solid #ccc;
    padding: 1em;
  }
  ${hoverGlow('.MyComponent')}

  .MyOtherComponent {
    border: 1px solid #ccc;
    padding: 1em;
  }
  ${hoverGlow('.MyOtherComponent', 'insane')}
`);
```

(This low-level utility function is used internally by
[`vanillaClassNested`](#vanillaclassnested).)

---

## `@reykjavik/webtools/fixIcelandicLocale`

As of early 2004, Google Chrome still does not support the Icelandic locale
`is`/`is-IS` in any way. Meanwhile other browsers have supported it for over a
decade.

This module does attempts to patches the following methods/classes by
substituting the `is` locale with `da` (Danish) and apply a few post-hoc fixes
to their return values.

- `Intl.Collator` and `String.prototype.localeCompare`
- `Intl.NumzberFormat` and `Number.prototype.toLocaleString`
- `Intl.DateTimeFormat` and `Date.prototype.toLocaleDateString`

This provides usable (but not perfect) results, with some caveats listed
below.

To apply these patches, simply "side-effect import" this module at the top of
your app's entry point:

```ts
import '@reykjavik/webtools/fixIcelandicLocale';

// Then continue with your day and use `localeCompare` and Intl.Collator,
// as you normally would. (See "limitations" below.)
```

(**NOTE** The patch is only applied in engines that fail a simple feature
detection test.)

### Limitations

**`Intl.Collator` and `localeCompare`:**

- When the `sensitivty` option is set to `"base"` or `"accent"`, it will
  incorrectly treat `ð` and `d` as the same letter, and the acute-accented
  characters `á`, `é`, `í`, `ó`, `ú` and `ý` get lumped in with their
  non-accented counterparts.

**`Intl.NumberFormat` and `toLocaleString`:**

- The `style: "unit"` option is not supported and prints units in Danish. (Soo
  many units and unit-variants…)
- The `currencyDisplay: "name"` option is not supported and prints the
  currency's full name in Danish.

**`Intl.DateTimeFormat` and `toLocaleDateString`:**

- The `month: 'narrow'` and `weekday: 'narrow'` options are not supported, and
  print the corresponding Danish initials
- For `timeZoneName` the values `"long"`, `"shortGeneric"` and `"longGeneric"`
  will appear in Danish.
- The `timeStyle: 'full'` option prints timezone will appear in Danish
- The `dayPeriod` option is not supported and prints the day-period in Danish.
- Custom formatted `DD.MM.YY` (2-digit year) dates turn into time-like
  `DD:MM:YY` strings.

---

## Framework Specific Tools

---

<!-- #fragment anchors to not break older v0.1 @see links -->

<a name="reykjavikwebtoolsnexthttp"></a> <a name="makeerrorizeapphoc"></a>
<a name="showerrorpage-helper"></a> <a name="notmodified304-helper"></a>
<a name="reykjavikwebtoolsnextsiteimprove"></a>
<a name="siteimprove-component"></a> <a name="pingsiteimprove-helper"></a>
<a name="pingsiteimproveoutbound-helper"></a>

### Next.js Tools

This package contains some helpers and components that are specifically
designed for use in [Next.js](https://nextjs.org/) projects.

See [README-nextjs.md](README-nextjs.md) for more info.

---

## Contributing

This project uses the [Bun runtime](https://bun.sh) for development (tests,
build, etc.)

PRs are welcome!

---

## Changelog

See
[CHANGELOG.md](https://github.com/reykjavikcity/webtools/blob/main/CHANGELOG.md)
