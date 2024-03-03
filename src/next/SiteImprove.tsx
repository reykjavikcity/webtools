import React, { ReactElement, useEffect } from 'react';
import { Router } from 'next/router.js';
import NextScript, { ScriptProps } from 'next/script.js';

import { useCookieHubConsent } from '../CookieHubConsent.js';

import {
  logOutboundLinks,
  makeScriptUrl,
  SiteImproveProps,
  trackDynamicPageView,
} from './SiteImprove.privates.js';

type ScriptType = (props: ScriptProps) => ReactElement | null;

// Fixes an issue with `next/script`'s types and mixture of default and named exports.
// This workaround doesn't seem to be necessary in Next.js 13.5 (pages router), but
// is definitely needed for the webpack bundler used by Next.js 11. (v12 is untested.)
const Script = ('__esModule' in NextScript && 'default' in NextScript
  ? NextScript.default
  : NextScript) as unknown as ScriptType;

// ---------------------------------------------------------------------------

/*
  SiteImprove's "trackdynamic" (page view) event requires both the new URL
  and the old (referer) URL.
  Next router's `routeChangeComplete` (which is the correct point in time
  to send the tracking event) does not provide access to the previous URL,
  so we need to capture it during `routeChangeStart`.
  We feel it's safe to assume that every `routeChangeComplete` event
  always fires directly after its `routeChangeStart` counterpart,
  and it is thus safe to simply store the old URL in a local variable.
  This may look dodgy, but should prove reasonably safe in practice.
*/

let _refUrl = '';

const captureRefUrl = () => {
  _refUrl = document.location.pathname + document.location.search;
};

const sendRoutingEvent = (url: string) => {
  // On `history.back()`/`history.forward()` the URL change happens before
  // `routeChangeStart`, so `refUrl` and `url` become the same.
  // in that case we suppress the `ref`
  const refUrl = _refUrl !== url ? _refUrl : undefined;

  trackDynamicPageView(url, refUrl, document.title);
};

// ===========================================================================

export type { SiteImproveProps } from './SiteImprove.privates.js';
export { pingSiteImprove, pingSiteImproveOutbound } from './SiteImprove.privates.js';

/**
 * A component for loading a SiteImprove analytics script and set up page-view
 * tracking across Next.js routes.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README-nextjs.md#siteimprove-component
 */
export const SiteImprove = (props: SiteImproveProps) => {
  const { analytics } = useCookieHubConsent();

  const consented =
    (analytics && props.hasConstented !== false) ||
    (analytics === undefined && props.hasConstented);

  useEffect(
    () => {
      if (!consented) {
        return;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.info(
          'Mock loading SiteImprove in development mode.',
          props.scriptUrl || props.accountId
        );
        if (!window._sz) {
          setTimeout(() => {
            window._sz = window._sz || [];
          }, 300);
        }
      }
      const routerEvents = Router.events;
      routerEvents.on('routeChangeStart', captureRefUrl);
      routerEvents.on('routeChangeComplete', sendRoutingEvent);
      const stopLoggingOutboundLinks = logOutboundLinks();
      return () => {
        routerEvents.off('routeChangeStart', captureRefUrl);
        routerEvents.off('routeChangeComplete', sendRoutingEvent);
        stopLoggingOutboundLinks();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [consented]
  );

  if (!consented || process.env.NODE_ENV !== 'production') {
    return null;
  }

  const scriptUrl =
    props.scriptUrl != null ? props.scriptUrl : makeScriptUrl(props.accountId);

  return (
    <Script
      type="text/javascript"
      strategy="afterInteractive"
      src={scriptUrl}
      onLoad={props.onLoad}
      onError={props.onError}
    />
  );
};
