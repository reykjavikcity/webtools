import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { EitherObj } from '@reykjavik/hanna-utils';

// --------------------------------------------------------------------------
// BEGIN: Mock typing of CookieHub's script API
/*
  CookieHub does not seem to provide any official TypeScript declarations
  for their code.
*/

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    cookiehub: CookieHub;
    // /** Alias for window.cookiehub */
    // cookieconsent: CookieHub;
  }
}

type CookieHub = {
  /**
   * Used to initialize, and configure, CookieHub.
   *
   * (Thin wrapper for `window.cookiehub.initialize`)
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  load(options?: CookieHubOptions): void;
  /**
   * Used to initialize, and configure, CookieHub.
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  initialize(options?: CookieHubOptions): void;
  /**
   * Used to check if the user has already made cookie choices.
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  hasAnswered(): boolean;
  /**
   * Used to check if the user has allowed the cookie category specified in
   * the category parameter.
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  hasConsented(category: CookieHubCategory): boolean;
  /**
   * Used to check if the CookieHub script has been initialized
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  hasInitialized(): boolean;
  /**
   * Open the CookieHub dialog.
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  openDialog(): void;
  /**
   * Close the CookieHub dialog if it's still open.
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  closeDialog(): void;
  /**
   * Open the CookieHub settings dialog. This may be useful if you choose to
   * hide the settings icon which is usually used to open the CookieHub
   * settings dialog and want to create a custom link or button to open the
   * dialog instead.
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  openSettings(): void;
  /**
   * Close the CookieHub settings dialog.
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  closeSettings(): void;
  /**
   * Denys all cookie categories.
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  denyAll(): void;
  /**
   * Allows all cookie categories.
   *
   * @see https://support.cookiehub.com/article/86-methods-functions
   */
  allowAll(): void;

  // The `window.cookiehub` object seems to have more methods,
  // but we don't really know what they do.
  // Documentation is lacking.
};

type CookieHubCategory =
  | 'necessary'
  | 'preferences'
  | 'analytics'
  | 'marketing'
  | 'uncategorized';

type CookieHubOptions = {
  /**
   * Fired when CookieHub has finished loading.
   *
   * @see https://support.cookiehub.com/article/87-events
   */
  onInitialise?: (this: CookieHub, status: CookiehubState) => void;

  /**
   * Fired any time users make changes to cookie choices and click the
   * Save Settings or if the Allow All Cookies button is clicked.
   *
   * @see https://support.cookiehub.com/article/87-events
   */
  onStatusChange?: (
    this: CookieHub,
    status: CookiehubState,
    previousStatus: CookiehubState
  ) => void;

  /**
   * Fired any time a cookie category is allowed that was previously disallowed.
   *
   * @see https://support.cookiehub.com/article/87-events
   */
  onAllow?: (this: CookieHub, category: CookieHubCategory) => void;

  /**
   * Fired any time a cookie category consent is revoked for a category that
   * was previously allowed.
   *
   * @see https://support.cookiehub.com/article/87-events
   */
  onRevoke?: (this: CookieHub, category: CookieHubCategory) => void;

  dialog?: {
    /**
     * Controls the display of the action buttons in the popup dialog.
     *
     * @see https://support.cookiehub.com/article/128-changing-the-order-of-action-buttons
     */
    actions?: Array<'allow' | 'deny' | 'settings'>;
  };

  cookie?: {
    /**
     * Empty string (`''`) will instruct the browser to set the cookie on
     * the current domain instead of the top level domain which is the
     * default value.
     *
     * @see https://support.cookiehub.com/article/85-cookiehub-on-multiple-domains-hosts
     */
    domain?: string;
    /**
     * Controls the cookie behavior and access for the cookiehub cookie
     *
     * Possible values are:
     *
     *  - **Lax** (Default): Allows pages on the domain and third party links
     *    to access the cookie. This is the default setting for CookieHub.
     *  - **Strict**: Only allows pages on the domain that set the cookie to
     *    access it. Links from third parties won’t be able to access the
     *    cookie.
     *  - **None**: No domain limitations and third-party cookies can fire.
     *
     * @see https://support.cookiehub.com/article/84-cookie-security-and-the-samesite-attribute
     */
    sameSite?: 'Strict' | 'Lax' | 'None';
    /**
     * If the Secure attribute is set to true, the cookie will only be accessible
     * if the page being loaded is loaded over a secure connection.
     *
     * Defaults to `false` but it's recommended to set it to true
     *
     * @see https://support.cookiehub.com/article/84-cookie-security-and-the-samesite-attribute
     */
    secure?: boolean;
  };
};

// Something, something, Google Tag Manager, something
type CookiehubState = {
  answered: boolean;
  preconsent: boolean;
  revision: number;
  dnt: boolean;
  allowSale: boolean;
  implict: boolean;
  region: string;
  token: string;
  timestamp: Date;
  categories: Array<CookieHubCategoryState>;
};

type CookieHubCategoryState = {
  cid: number;
  id: CookieHubCategory;
  value: boolean;
  preconsent: boolean;
  fired: boolean;
};

// END: Mock typing of CookieHub's script API
// --------------------------------------------------------------------------

//

// ---------------------------------------------------------------------------

const idToken = '[ACCOUNT_ID]';
const scriptUrlTemplate =
  process.env.NODE_ENV === 'production'
    ? `https://cookiehub.net/c2/${idToken}.js`
    : `https://cookiehub.net/dev/${idToken}.js`;

// ---------------------------------------------------------------------------

type CookieHubContextState = {
  // **NOTE:**
  // CookieHub's API also has "necessary" category, but that's redundant
  // as GDPR explicitly auto-allows such cookies
  consent: Record<Exclude<CookieHubCategory, 'necessary'>, boolean>;
};

const CookieHubContext = createContext<CookieHubContextState | undefined>(undefined);

/**
 * Used as the initial/default state when CookieHubProvider mounts and
 * prepares to load the script
 */
const initialConsentState: CookieHubContextState = {
  consent: {
    analytics: false,
    preferences: false,
    marketing: false,
    uncategorized: false,
  },
};

export type CookieHubProviderProps = EitherObj<
  {
    /**
     * Yuour CookieHub account ID.
     *
     * It's a random-looking alpha-numerical string, and it can usually be
     * extracted from the script embed URL like this:
     * `"https://cookiehub.net/c2/[ACCOUNT_ID].js"`
     *
     * @see https://support.cookiehub.com/article/155-manual-implementation-guide
     */
    accountId: string;
  },
  {
    /**
     * The full CookieHub embed script URL.
     *
     * Something like `"https://cookiehub.net/c2/[ACCOUNT_ID].js"`
     *
     * @see https://support.cookiehub.com/article/155-manual-implementation-guide
     */
    scriptUrl: string;
  }
> & {
  children: ReactNode;

  /**
   * Custom callback that fires when CookieHub has initialized.
   *
   * To subscribe to other events run:
   *
   * ```js
   * window.cookiehub.initialize({
   *   // Event handlers other than `onInitialize`
   * })
   * ```
   *
   * @see https://support.cookiehub.com/article/87-events
   */
  options?: CookieHubOptions;

  /**
   * Error callback for if the CookieHub script fails to load.
   */
  onError?: OnErrorEventHandlerNonNull;
};

/**
 * Moves the CookieHub `<div/>` to the bottom of the dom tree
 * for better accessability in screen readers.
 */
const moveCookiehubScriptInDomTree = () => {
  const cookieHubPromptElm = document.querySelector('.ch2');
  if (cookieHubPromptElm) {
    document.body.append(cookieHubPromptElm);
  }
};

/**
 * This context provider component loads and initialises the CookieHub consent
 * management script and sets up a React state object with the relevant user
 * consent flags.
 *
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1##cookiehubprovider-component
 */
export const CookieHubProvider = (props: CookieHubProviderProps) => {
  const [state, setState] = useState<CookieHubContextState>(initialConsentState);

  useEffect(
    () => {
      const script = document.createElement('script');
      script.async = true;

      const opts = props.options || {};

      script.src =
        props.scriptUrl != null
          ? props.scriptUrl
          : scriptUrlTemplate.replace(idToken, props.accountId);

      script.onload = () => {
        window.cookiehub.load({
          ...opts,
          onInitialise(status) {
            const analytics = this.hasConsented('analytics');
            const preferences = this.hasConsented('preferences');
            const marketing = this.hasConsented('marketing');
            const uncategorized = this.hasConsented('uncategorized');
            // only trigger re-render if the consent is different from the default (all false)
            if (analytics || preferences || marketing || uncategorized) {
              setState({
                consent: {
                  analytics,
                  preferences,
                  marketing,
                  uncategorized,
                },
              });
            }
            opts.onInitialise && opts.onInitialise.call(this, status);
          },
          onAllow(category) {
            if (category === 'necessary') {
              return;
            }
            setState((state) => ({
              ...state,
              consent: { ...state.consent, [category]: true },
            }));
            opts.onAllow && opts.onAllow.call(this, category);
          },
          onRevoke(category) {
            if (category === 'necessary') {
              return;
            }
            setState((state) => ({
              ...state,
              consent: { ...state.consent, [category]: false },
            }));
            opts.onAllow && opts.onAllow.call(this, category);
          },
          cookie: {
            secure: true,
            ...opts.cookie,
          },
        });
        moveCookiehubScriptInDomTree();
      };

      props.onError && (script.onerror = props.onError);

      document.body.append(script);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <CookieHubContext.Provider value={state}>{props.children}</CookieHubContext.Provider>
  );
};

// ---------------------------------------------------------------------------

/**
 * Returns up-to-date cookie consent flags. For use in React components or hook
 * functions.
 *
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1##usecookiehubconsent
 */
export const useCookieHubConsent = (): Partial<CookieHubContextState['consent']> =>
  useContext(CookieHubContext)?.consent || {};
