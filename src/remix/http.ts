/**
 * Detects if the request is a client fetch, or an initial/full-page load.
 * Useful for deciding whether to defer data fetching or not.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README-remix.md#isclientfetch
 */
export const isClientFetch = (request: Request): boolean =>
  // For info about this detection method:
  // - https://github.com/remix-run/remix/discussions/5583
  // - https://github.com/sergiodxa/remix-utils/discussions/311#discussioncomment-8572497
  (request.headers.get('Sec-Fetch-Dest') || '') === 'empty';
