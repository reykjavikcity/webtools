import React, { useEffect } from 'react';
import { EitherObj } from '@reykjavik/hanna-utils';
import { Router } from 'next/router';
import Script from 'next/script';

import { useCookieHubConsent } from '../CookieHubConsent';

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
    };
  }
}
type SiteImproveEvent = SiteImprovePageView | SiteImproveCustomEvent;

type SiteImprovePageView = [
  type: 'trackdynamic',
  data: {
    /** New page URL */
    url: string;
    /** The previous (referer) URL */
    ref: string;
    /** New page title */
    title?: string;
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
        if (process.env.NODE_ENV === 'development') {
          console.info('SiteImprove:', event);
        } else {
          _sz.push(event);
        }
      };

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
      ref: refUrl,
      title: document.title,
    },
  ]);

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
   * Any other value causes the component to defer to the `CookieHubProvider`
   * component, and only applies if the cookiehub flag is undefined.
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
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1##siteimprove-component
 */
export const SiteImprove = (props: SiteImproveProps) => {
  const { analytics } = useCookieHubConsent();

  const consented =
    (analytics && props.hasConstented !== false) ||
    (analytics === undefined && props.hasConstented);

  useEffect(() => {
    if (consented) {
      const routerEvents = Router.events;
      routerEvents.on('routeChangeStart', captureRefUrl);
      routerEvents.on('routeChangeComplete', sendRoutingEvent);
      return () => {
        routerEvents.off('routeChangeStart', captureRefUrl);
        routerEvents.off('routeChangeComplete', sendRoutingEvent);
      };
    }
  }, [consented]);

  if (!consented) {
    return null;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.info('Mock loading SiteImprove in development mode.');
    if (!window._sz) {
      setTimeout(() => {
        window._sz = window._sz || [];
      }, 300);
    }
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

// ---------------------------------------------------------------------------

/**
 * A small helper for tracking custom UI events and reporting them to SiteImrove.
 *
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1##pingsiteimprove-helper
 */
export const pingSiteImprove = (category: string, action: string, label?: string) => {
  if (
    process.env.NODE_ENV === 'development' &&
    (!window._sz || window._sz._jit_defined_)
  ) {
    console.warn('`pingSiteImprove` Was called before SiteImprove script was loaded.');
  }
  _emitEvent(['event', category, action, label]);
};
