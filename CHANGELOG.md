# Change Log for `es-in-css`

## Upcoming...

- ... <!-- Add new lines here. -->
- `@reykjavik/webtools/next/SiteImprove`:
  - fix: Remove stray, unused import

## 0.1.7

_2023-04-19_

- `@reykjavik/webtools/next/SiteImprove`:
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
