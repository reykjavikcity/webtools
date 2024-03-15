import React, { useEffect } from 'react';
import { EitherObj } from '@reykjavik/hanna-utils';

import { useCookieHubConsent } from './CookieHubConsent.js';

// ---------------------------------------------------------------------------
// Event tracking - https://help.siteimprove.com/support/solutions/articles/80000863895-getting-started-with-event-tracking
// Custom page visit tracking - https://help.siteimprove.com/support/solutions/articles/80000448441-siteimprove-analytics-custom-visit-tracking
// Since SiteImprove does not track client-side route changes in frameworks
// that perform client-side (`pushState`) routing, such as Remix and Next.js,
// we must manually track them by monitoring document.location changes.

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
 * A small helper to send "trackdynamic" page view/load events to SiteImrove.
 */
const trackDynamicPageView = (url: string, refUrl?: string, title?: string) =>
  _emitEvent(['trackdynamic', { url, ref: refUrl, title }]);

// ---------------------------------------------------------------------------

/**
 * A small helper for tracking custom UI events and reporting them to SiteImrove.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#pingsiteimprove-helper
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
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#pingsiteimproveoutbound-helper
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

const logOutboundLinks = () => {
  // NOTE: It's normal for SiteImprove's outbound logging to happen also for internal
  // links, but it's not a problem since SiteImprove filter the results themselves.
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

const makeScriptUrl = (accountId: string) =>
  `https://siteimproveanalytics.com/js/siteanalyze_${accountId}.js`;

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
  hasConsented?: boolean;

  // /**
  //  * The path name of the current page. \
  //  * When this value changes a `trackdynamic` (page view) event is sent to
  //  * SiteImprove.
  //  *
  //  */
  // pathname: string;

  /**
   * Custom callback for when the SiteImprove script has loaded.
   */
  onLoad?: (e: unknown) => void;

  /**
   * Error callback for if the SiteImprove script fails to load.
   */
  onError?: (e: unknown) => void;
};

// ---------------------------------------------------------------------------

const useResolvedAnalyticsConsent = (hasConsented: boolean | undefined) => {
  const { analytics } = useCookieHubConsent();

  return (
    (analytics && hasConsented !== false) || (analytics === undefined && hasConsented)
  );
};

// ---------------------------------------------------------------------------

const mockSIGlobalIfNeeded = (props: SiteImproveProps) => {
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(() => {
      if (!window._sz) {
        console.info(
          'Mock loading SiteImprove in development mode.',
          props.scriptUrl || props.accountId
        );
        window._sz = [];
      }
    }, 300);
  }
};

// ===========================================================================

let lastUrl: string | undefined;
const loc =
  typeof document !== 'undefined' ? document.location : ({} as Record<string, undefined>);

/**
 * A component for loading a SiteImprove analytics script and set up page-view
 * tracking across client-side (pushState, replaceState) routing.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#siteimprove-component
 */
export const SiteImprove = (props: SiteImproveProps) => {
  const consented = useResolvedAnalyticsConsent(props.hasConsented);

  const thisUrl = `${loc.pathname}${loc.search}${loc.hash}`;

  useEffect(() => {
    if (!consented) {
      lastUrl = thisUrl;
      return;
    }
    if (lastUrl === undefined) {
      lastUrl = thisUrl;
    }
    const checkCurrentUrl = () => {
      if (thisUrl !== lastUrl) {
        trackDynamicPageView(thisUrl, lastUrl, document.title);
        lastUrl = thisUrl;
      }
    };
    checkCurrentUrl();
    window.addEventListener('popstate', checkCurrentUrl);

    return () => window.removeEventListener('popstate', checkCurrentUrl);
  }, [consented, thisUrl]);

  useEffect(
    () => {
      if (!consented) {
        return;
      }
      mockSIGlobalIfNeeded(props);
      return logOutboundLinks();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [consented]
  );

  if (!consented || process.env.NODE_ENV !== 'production') {
    return null;
  }

  const scriptUrl = props.scriptUrl ?? makeScriptUrl(props.accountId);

  return <script defer src={scriptUrl} onLoad={props.onLoad} onError={props.onError} />;
};
