# Change Log for `@reykjavik/webtools`

## Upcoming...

- ... <!-- Add new lines here. -->

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
