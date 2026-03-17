# Change Log for `@reykjavik/webtools`

## Upcoming...

- ... <!-- Add new lines here. -->
- `@reykjavik/webtools/alertsStore`:
  - feat: Make alert `type` property disabled by default, enabled via config
  - feat: Add `AlerterConfig.title?:boolean` to enable optional alert `title`s

## 0.3.7 – 0.3.11

_2026-03-16_

- feat: Add `@reykjavik/webtools/alertsStore` for toasts and other global UI
  feedback messages along with `@reykjavik/webtools/alertsStore/react` helpers

## 0.3.6

_2026-02-24_

- `@reykjavik/webtools/async`:
  - feat: Add `cachifyAsync` helper for simple (yet robust) caching of async
    functions

## 0.3.5

_2026-02-18_

- `@reykjavik/webtools/errorhandling`:
  - fix: `Result.ErrorOf<T>` not handling functions with parameters correctly

## 0.3.4

_2026-02-17_

- `@reykjavik/webtools/errorhandling`:
  - feat: Add type `Result.ErrorOf<T>` to extract the error type of a
    `ResultTuple<T>` or a `ResultTuple`-returning function

## 0.3.3

_2026-02-13_

- `@reykjavik/webtools/errorhandling`:
  - feat: Make `ResultFail` better infer its error type from the argument

## 0.3.2

_2025-12-01_

- `@reykjavik/webtools/errorhandling`:
  - feat: Add type `Result.PayloadOf<T>` to extract the successful payload
    type from a `ResultTuple<T>` or a `ResultTuple`-returning functions

## 0.3.0 – 0.3.1

_2025-11-10_

- `@reykjavik/webtools/http`:
  - **BREAKING** feat: `toMs()` now treats raw numbers as milliseconds (not as
    seconds)
- `@reykjavik/webtools/errorhandling`:
  - feat: Alias `Result.catch()` as `Result.ify()` for readability

## 0.2.9 – 0.2.10

_2025-09-30_

- `@reykjavik/webtools/next/vanillaExtract`:
  - feat: Make `vanillaVars` return a type-safe `setVars()` helper to avoid
    offending VSCode's CSS syntax parser too much

## 0.2.8

_2025-09-17_

- `@reykjavik/webtools/async`:
  - feat: Add `debounce` and `throttle` helpers
- `@reykjavik/webtools/hooks` (new module):
  - feat: Add `useDebounced` and `useThrottled` hooks

## 0.2.7

_2025-09-01_

- `@reykjavik/webtools/fixIcelandicLocale`:
  - fix: Check for support of each Intl class separately
- docs: Improve JSDocs and README for `asError()` and `ErrorFromPayload`

## 0.2.6

_2025-06-20_

- `@reykjavik/webtools/next/vanillaExtract`:
  - feat: Add `vanillaVars` helper to generate privately scoped CSS variables

## 0.2.5

_2025-05-21_

- `@reykjavik/webtools/async`:
  - feat: Support passing `AbortSignal` to `sleep` and `addLag` helpers

## 0.2.4

_2025-05-09_

- perf: Add `#__NO_SIDE_EFFECTS__` compiler notation to selected functions

## 0.2.3

_2025-03-31_

- `@reykjavik/webtools/errorhandling`:
  - feat: Add a `.mapTo(fn)` method to `ResultTupleObj`s
  - fix: `Result.map` does not catch errors thrown by the mapping function
  - docs: Fix minor error in README code example

## 0.2.2

_2024-12-19_

- `@reykjavik/webtools/CookieHubConsent`:
  - feat: Allow passing explicit `undefined` as `accountId` to skip loading
  - fix: Note that `window.cookiehub` is possibly `undefined` (before load)

## 0.2.1

_2024-12-17_

- `@reykjavik/webtools/errorhandling`:
  - fix: Make typing of failed ResultTuple/ResultTupleObj less ambiguous

## 0.2.0

_2024-12-12_

- feat: Add `@reykjavik/webtools/react-router/*` (previously `/remix/*`)
- **BREAKING** feat: Remove all `@reykjavik/webtools/remix/*` modules
- **BREAKING** feat: Bump `pkg.engines.node` version to >=20
- **BREAKING** feat: Remove `@reykjavik/webtools/next/SiteImprove` (deprecated
  module)
- **BREAKING** feat: Remove deprecated exports `vanillaNest` and
  `vanillaClassNested` from `@reykjavik/webtools/vanillaExtract`

## 0.1.37

_2024-10-23_

- `@reykjavik/webtools/SiteImprove`:
  - fix: `onLoad` and `onError` callback arguments are now typed as `Event`
  - fix: Script wasn't actually loading. Now it does.

## 0.1.35 – 0.1.36

_2024-10-18_

- `@reykjavik/webtools/next/vanillaExtract`:
  - feat: `vanillaClass` auto-replaces `&&` tokens in a plain-string input
  - docs: Minor improvements to README and JSDoc comments

## 0.1.34

_2024-10-17_

- `@reykjavik/webtools/next/vanillaExtract`:
  - feat: `vanillaClass` passes `classNameSelector` a second parameter to the
    render callback.

## 0.1.33

_2024-10-16_

- `@reykjavik/webtools/next/vanillaExtract`:
  - feat: Deprecate `vanillaNest` and `vanillaClassNested` — in favor of
    `vanillaClass` with `className` function parameter, or other home-brew
    solutions.
  - docs: Improve inline JSDocs and README for the `vanilla*` helpers
- `@reykjavik/webtools/errorhandling`:
  - docs: Improve code examples in README

## 0.1.32

_2024-10-02_

- feat: Add module `@reykjavik/webtools/errorhandling` with `asError` and
  `Result.*` helpers for safe, structured error handling with discriminated
  `[error, result]` tuples.

## 0.1.31

_2024-09-23_

- `@reykjavik/webtools/async`:
  - feat: `maxWait` returns full `PromiseSettledResult` objects
  - fix: `maxWait` result objects should remain stable
  - fix: `maxWait` should distinguish between unresolved and rejected promises

## 0.1.30

_2024-09-15_

- `@reykjavik/webtools/http`:
  - feat: Add `toMs` duration helper
- `@reykjavik/webtools/fixIcelandicLocale`:
  - feat: Patch `Intl.RelativeTimeFormat`
  - feat: Patch all `supportedLocalesOf` methods to report "is\*" as supported
  - fix: Incorrect `PluralRules` results for negative values
  - fix: Use each `Intl.*` class' `supportedLocalesOf` method to map locales
  - fix: Remove unnecessary `Intl.\*` method instance-bindings

## 0.1.28 – 0.1.29

_2024-08-26_

- `@reykjavik/webtools/http`:
  - feat: Add `cacheControlHeaders` helper that returns a `HeadersInit` object
  - feat: `cacheControl` now also accepts `Map<string, string>` for headers
  - fix: `cacheControl` with `maxAge: 'unset'` didn't delete `X-Cache-Control`
    in dev mode

## 0.1.27

_2024-07-18_

- `@reykjavik/webtools/next/vanillaExtract`:
  - feat: `vanillaClass` now accepts a function that receives the generated
    `className` as parameter

## 0.1.26

_2024-05-25_

- `@reykjavik/webtools/fixIcelandicLocale`:
  - fix: Emit `"*dagur, "`, not `"*dagurinn "` from `Intl.DateTimeFormat`

## 0.1.25

_2024-05-17_

- `@reykjavik/webtools/http`:
  - feat: `cacheControl` now also accepts standard `Response` objects

## 0.1.24

_2024-03-22_

- `@reykjavik/webtools/fixIcelandicLocale`:
  - fix: Add missing patches for `Date.prototype.toLocaleString` and
    `Date.prototype.toLocaleTimeString`
  - fix: Correct `Date.prototype.toLocaleDateString` options defaults/handling

## 0.1.23

_2024-03-21_

- feat: Add framework agnostic `@reykjavik/webtools/SiteImprove` module —
  deprecate `@reykjavik/webtools/next/SiteImprove` instead
- `@reykjavik/webtools/remix/Wait`:
  - fix: Properly reject `data.$error`s as to not trigger error boundaries
- `@reykjavik/webtools/async`:
  - fix: `maxWait` should gracefully ignore rejecting promises

## 0.1.21 – 0.1.22

_2024-03-14_

- feat: Add `@reykjavik/webtools/remix/Wait` component
- feat: Add `@reykjavik/webtools/remix/http` module — with `isClientFetch`
  helper
- feat: Add `@reykjavik/webtools/async` module with promise helpers

## 0.1.18 – 0.1.20

_2024-03-11_

- `@reykjavik/webtools/fixIcelandicLocale`:
  - feat: Patch `Intl.PluralRules` and `Intl.ListFormat`
  - fix: Incorrect alphabetization of accented characters as part of a word …
    (not just a single character) This fix corrects the sorting of initial
    letters, but characters inside the string stay mixed in with their
    unaccented base character.
  - fix: Make all pached `Intl.*` methods bound to their instances

## 0.1.16 – 0.1.17

_2024-03-09_

- `@reykjavik/webtools/fixIcelandicLocale`:
  - fix: Add missing `DateTimeFormat.format*ToParts` methods, fix bugs
  - refctor: Reduce code-size and simplify logic by dog-fooding `*ToParts`
    methods internally

## 0.1.15

_2024-03-08_

- `@reykjavik/webtools/fixIcelandicLocale`:
  - feat: Patch `Intl.Collator`
  - feat: Patch `Intl.NumberFormat` and `Number.prototype.toLocaleString`
  - feat: Patch `Intl.DateTimeFormat` and `Date.prototype.toLocaleDateString`

## 0.1.13 – 0.1.14

_2024-03-06_

- feat: Add `@reykjavik/webtools/fixIcelandicLocale` Chrome paching module

## 0.1.12

_2024-02-29_

- feat: Add `@reykjavik/webtools/next/vanillaExtract` module — with plain-CSS
  injection helpers
- fix: Mark `peerDependencies` as optional

## 0.1.11

_2024-02-14_

- fix: Issue with `SiteImprove` import `next/script` in Next.js < 13

## 0.1.10

_2024-02-14_

- `@reykjavik/webtools/http`:
  - feat: Add the rest of the more obscure HTTP status constants (WebDAV,
    etc.)
  - fix: Add `429`, `432`, `451` to `HTTP_CLIENT_ERROR_ALL` type

## 0.1.9

_2023-04-27_

- `@reykjavik/webtools/http`:
  - feat: Add `toSec` TTL helper

## 0.1.7 – 0.1.8

_2023-04-19_

- `@reykjavik/webtools/next/SiteImprove`:
  - feat: Always push events to `window._sz`, even in development mode
  - feat: Auto-track outbound link clicks, also for late-injected elements.
  - feat: Add `pingSiteImproveOutbound` helper
  - fix: Strip pageview ref URLs on history back/forward traversal
- `@reykjavik/webtools/next/http`
  - fix: Make `ErrorProps` accept `HTTP_ERROR_ALL`

## 0.1.0 – 0.1.6

_2023-03-24_

- feat: Initial release with:
  - HTTP helpers — both generic and Next.js specific
  - React component + hook to make CookieHub consent easier to use.
  - React component + custom-ping function for SiteImprove analytics.
