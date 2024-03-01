import React, { useEffect } from 'react';
import { EitherObj } from '@reykjavik/hanna-utils';
import { Router } from 'next/router.js';
import NextScript, { ScriptProps } from 'next/script.js';

import { useCookieHubConsent } from '../CookieHubConsent.js';

type ScriptType = (props: ScriptProps) => JSX.Element | null;

// Fixes an issue with `next/script`'s types and mixture of default and named exports.
// This workaround doesn't seem to be necessary in Next.js 13.5 (pages router), but
// is definitely needed for the webpack bundler used by Next.js 11. (v12 is untested.)
const Script = ('__esModule' in NextScript && 'default' in NextScript
  ? NextScript.default
  : NextScript) as unknown as ScriptType;

// ---------------------------------------------------------------------------

// Event tracking - https://help.siteimprove.com/support/solutions/articles/80000863895-getting-started-with-event-tracking
// Custom page visit tracking - https://help.siteimprove.com/support/solutions/articles/80000448441-siteimprove-analytics-custom-visit-tracking
// Since SiteImprove does not track route changes in NextJS via Link routing, we must manually track them

// --------------------------------------------------------------------------
// BEGIN: Mock typing of SiteImprove's event tracking API
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    _sz?: Array<SiteImproveEvent> & {
      /**
       * Set if posting a tracking event is attempted before SiteImprove has
       * been initialized, and the window._sz array had to be initialized
       * just-in-time.
       */
      _jit_defined_?: true;
      core?: {
        data: Array<SiteImproveEvent>;
      };
    };
  }
}
type SiteImproveEvent = SiteImprovePageView | SiteImproveRequest | SiteImproveCustomEvent;

type SiteImprovePageView = [
  type: 'trackdynamic',
  data: {
    /** New page URL */
    url: string;
    /** The previous (referer) URL */
    ref?: string;
    /** New page title */
    title?: string;
  }
];
type SiteImproveRequest = [
  type: 'request',
  data: {
    /** Outbound URL */
    ourl: string;
    /** The current page URL */
    ref: string;

    autoonclick?: 1;
  }
];
type SiteImproveCustomEvent = [
  type: 'event',
  category: string,
  action: string,
  label?: string
];
// END: Mock typing of SiteImprove's event tracking API
// --------------------------------------------------------------------------

//

// ---------------------------------------------------------------------------

const _emitEvent =
  typeof window === 'undefined'
    ? () => undefined
    : (event: SiteImproveEvent) => {
        let _sz = window._sz;
        if (!_sz) {
          _sz = window._sz = [];
          _sz._jit_defined_ = true;
        }
        _sz.push(event);
        if (process.env.NODE_ENV === 'development') {
          console.info('SiteImprove:', event);
        }
      };

// ---------------------------------------------------------------------------

/**
 * A small helper for tracking custom UI events and reporting them to SiteImrove.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README-nextjs.md#pingsiteimprove-helper
 */
export const pingSiteImprove = (category: string, action: string, label?: string) => {
  if (
    process.env.NODE_ENV === 'development' &&
    (!window._sz || window._sz._jit_defined_)
  ) {
    console.warn('`pingSiteImprove` was called before SiteImprove script was loaded.');
  }
  _emitEvent(['event', category, action, label]);
};

// ---------------------------------------------------------------------------

/**
 * A small helper for reporting to SiteImrove when the user is programmatically
 * being sent to a different URL/resource.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README-nextjs.md#pingsiteimproveoutbound-helper
 */
export const pingSiteImproveOutbound = (ourl: string) => {
  if (
    process.env.NODE_ENV === 'development' &&
    (!window._sz || window._sz._jit_defined_)
  ) {
    console.warn(
      '`pingSiteImproveOutbound` was called before SiteImprove script was loaded.'
    );
  }
  _emitEvent(['request', { ourl, ref: document.location.href }]);
};

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

let refUrl = '';

const captureRefUrl = () => {
  refUrl = document.location.pathname + document.location.search;
};

const sendRoutingEvent = (url: string) =>
  _emitEvent([
    'trackdynamic',
    {
      url,
      // On `history.back()`/`history.forward()` the URL change happens before
      // `routeChangeStart`, so `refUrl` and `url` become the same.
      // in that case we suppress the `ref`
      ref: refUrl !== url ? refUrl : undefined,
      title: document.title,
    },
  ]);

// ---------------------------------------------------------------------------

const logOutboundLinks = () => {
  const captureLinkClicks = (e: MouseEvent) => {
    const link = (e.target as Element).closest<HTMLAnchorElement & { $$bound?: boolean }>(
      'a[href]'
    );
    if (!link || link.$$bound) {
      return;
    }
    link.$$bound = true;
    // Waiting for the bubble phase allows other click handlers to preventDefault()
    link.addEventListener('click', (e) => {
      if (e.defaultPrevented) {
        return;
      }
      // Skip logging outbound request if SiteImprove has already done so.
      // BTW, SiteImprove binds its autoonclick handlers on "mousedown"
      // so they're guaranteed to have run before our "click" listener.
      const events = window._sz?.core?.data;
      const [type, data] = (events && events[events.length - 1]) || [];
      if (type === 'request' && data.autoonclick && data.ourl === link.href) {
        return;
      }
      pingSiteImproveOutbound(link.href);
    });
  };
  const { body } = document;

  // bind 'click' listener to the capture phase
  body.addEventListener('click', captureLinkClicks, true);
  return () => body.removeEventListener('click', captureLinkClicks, true);
};

// ---------------------------------------------------------------------------

const idToken = '[ACCOUNT_ID]';
const scriptUrlTemplate = `https://siteimproveanalytics.com/js/siteanalyze_${idToken}.js`;

// ---------------------------------------------------------------------------

export type SiteImproveProps = EitherObj<
  {
    /**
     * Your SiteImprove account ID.
     *
     * It's a random-looking numerical string, and it can usually be
     * extracted from the script embed URL like this:
     * `"https://siteimproveanalytics.com/js/siteanalyze_[ACCOUNT_ID].js"`
     */
    accountId: string;
  },
  {
    /**
     * The full SiteImprove analytics script URL.
     *
     * Something like `"https://siteimproveanalytics.com/js/siteanalyze_[ACCOUNT_ID].js"`
     */
    scriptUrl: string;
  }
> & {
  /**
   * Manual GDPR 'analytics' consent flag.
   *
   * A value of `false` prevents the analytics script being loaded.
   *
   * A value of `true` still defers to the 'analytics' consent state provided
   * by the `CookieHubProvider` component (if present).
   */
  hasConstented?: boolean;

  /**
   * Custom callback for when the SiteImprove script has loaded.
   */
  onLoad?: (e: unknown) => void;

  /**
   * Error callback for if the SiteImprove script fails to load.
   */
  onError?: (e: unknown) => void;
};

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
    props.scriptUrl != null
      ? props.scriptUrl
      : scriptUrlTemplate.replace(idToken, props.accountId);

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
