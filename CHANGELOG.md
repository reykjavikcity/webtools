# Change Log for `@reykjavik/webtools`

## Upcoming...

- ... <!-- Add new lines here. -->
- `@reykjavik/webtools/fixIcelandicLocale`:
  - feat: Patch `Intl.Collator`
  - feat: Patch `Intl.NumberFormat` and `Number.prototype.toLocaleString`

## 0.1.13 – 0.1.14

_2024-03-06_

- feat: Add `@reykjavik/webtools/fixIcelandicLocale` Chrome paching module

## 0.1.12

_2024-02-29_

- feat: Add `@reykjavik/webtools/next/vanillaExtract` component — with
  plain-CSS injection helpers
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
