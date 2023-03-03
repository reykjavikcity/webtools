import { ServerResponse } from 'http';

export const HTTP_200_OK = 200;
/**
 * The request succeeded, and a new resource was created as a result.
 * This is typically the response sent after POST requests,
 * or some PUT requests.
 **/
export const HTTP_201_Created = 201;
/*
 * The request has been received but not yet acted upon.
 * Uee in cases where another process or server handles the request.
 */
export const HTTP_202_Accepted = 202;

/**
 * Only safe to use in response to GET and HEAD requests
 *
 * @deprecated  Instead use `HTTP_308_PermanentRedirect`.
 */
export const HTTP_301_MovedPermanently = 301;
/**
 * Only safe to use in response to GET and HEAD requests
 *
 * @deprecated  Instead use `HTTP_307_TemporaryRedirect`.
 */
export const HTTP_302_Found = 302;
/** Use when POST or PUT successfully rediects to the created resource */
export const HTTP_303_SeeOther = 303;
/** Use in response GET and HEAD requests with `If-Modified-Since`/`If-None-Match` heaaders */
export const HTTP_304_NotModified = 304;
export const HTTP_307_TemporaryRedirect = 307;
export const HTTP_308_PermanentRedirect = 308;

/** The request is malformed (e.g. a URL param is of a wrong type) */
export const HTTP_400_BadRequest = 400;
/** User is not authenticated (i.e. not logged in) */
export const HTTP_401_Unauthorized = 401;
/** User is logged in but doesn't have the necessary privileges */
export const HTTP_403_Forbidden = 403;
/** The request looks OK but the resource does not exist */
export const HTTP_404_NotFound = 404;
/**
 * The resource has been permanently deleted from server, with no forwarding
 * address.
 */
export const HTTP_410_Gone = 410;
/** The server refuses the attempt to brew coffee with a teapot. */
export const HTTP_418_ImATeapot = 418;

export const HTTP_500_InternalServerError = 500;

// ---------------------------------------------------------------------------
// Types for HTTP Status codes

export type HTTP_SUCCESS =
  | typeof HTTP_200_OK
  | typeof HTTP_201_Created
  | typeof HTTP_202_Accepted;

export type HTTP_REDIRECTION =
  | typeof HTTP_301_MovedPermanently
  | typeof HTTP_302_Found
  | typeof HTTP_303_SeeOther
  | typeof HTTP_304_NotModified
  | typeof HTTP_307_TemporaryRedirect
  | typeof HTTP_308_PermanentRedirect;

export type HTTP_NOTMODIFIED = typeof HTTP_304_NotModified;

export type HTTP_CLIENT_ERROR =
  | typeof HTTP_400_BadRequest
  | typeof HTTP_401_Unauthorized
  | typeof HTTP_403_Forbidden
  | typeof HTTP_404_NotFound
  | typeof HTTP_410_Gone
  | typeof HTTP_418_ImATeapot;

export type HTTP_NOT_FOUND =
  | typeof HTTP_400_BadRequest
  | typeof HTTP_404_NotFound
  | typeof HTTP_410_Gone;
export type HTTP_BANNED = typeof HTTP_401_Unauthorized | typeof HTTP_403_Forbidden;

export type HTTP_SERVER_ERROR = typeof HTTP_500_InternalServerError;

export type HTTP_ERROR = HTTP_CLIENT_ERROR | HTTP_SERVER_ERROR;

export type HTTP_STATUS =
  | HTTP_SUCCESS
  | HTTP_REDIRECTION
  | HTTP_CLIENT_ERROR
  | HTTP_SERVER_ERROR;

// ---------------------------------------------------------------------------

type TimeUnit = 's' | 'm' | 'h' | 'd' | 'w';
type TTL = number | `${number}${TimeUnit}`;
type TTLKeywords = 'permanent' | 'unset' | 'no-cache';
type TTLObj = {
  /** Sets the cache `max-age=` for the resource. */
  maxAge: TTL | TTLKeywords;
  /** Sets `stale-while-revalidate=` for the resource */
  staleWhileRevalidate?: TTL;
  // Sets `stale-if-error=` for the resource */
  staleIfError?: TTL;
  /** Sets the response caching as "public", instead of the default "private" */
  publ?: boolean;
  /** Sets a 'must-revalidate' flag instead of the default 'immutable'  */
  stability?: 'revalidate' | 'immutable' | 'normal';
};

/**
 * Configures quick TTL-related settings for a HTTP request object
 *
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1#type-ttlconfig
 */
export type TTLConfig = TTL | TTLKeywords | TTLObj;

const unitToSeconds: Record<TimeUnit, number> = {
  s: 1,
  m: 60,
  h: 3_600,
  d: 24 * 3_600,
  w: 7 * 24 * 3_600,
};

const toSec = (ttl: TTL | undefined): number | undefined => {
  if (ttl == null) {
    return;
  }
  if (typeof ttl === 'string') {
    const value = parseFloat(ttl);
    const factor = unitToSeconds[ttl.slice(-1) as TimeUnit] || 1;
    ttl = value * factor;
  }
  return !isNaN(ttl) ? ttl : undefined;
};

const stabilities: Record<NonNullable<TTLObj['stability']>, string> = {
  revalidate: ', must-revalidate',
  immutable: ', immutable',
  normal: '',
};

const setCC = (response: ServerResponse, cc: string | undefined) => {
  const devModeHeader = 'X-Cache-Control';
  // Also set `X-Cache-Control` in dev mode, because some frameworks
  // **cough** **nextjs** **cough** forcefully override the `Cache-Control`
  // header when the server is in dev mode.
  if (!cc) {
    response.removeHeader('Cache-Control');
    process.env.NODE_ENV !== 'production' && response.removeHeader(devModeHeader);
    return;
  }
  response.setHeader('Cache-Control', cc);
  process.env.NODE_ENV !== 'production' && response.setHeader(devModeHeader, cc);
};

/**
 * Use this function to quickly set the `Cache-Control` header with a `max-age=`
 * on a HTTP response
 *
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1#getcssbundleurl
 */
// eslint-disable-next-line complexity
export const cacheControl = (
  response: ServerResponse | { res: ServerResponse },
  ttlCfg: TTLConfig,
  eTag?: string | number
) => {
  response = 'res' in response ? response.res : response;
  const opts =
    typeof ttlCfg === 'number' || typeof ttlCfg === 'string'
      ? { maxAge: ttlCfg }
      : ttlCfg;

  let maxAge: typeof opts.maxAge | undefined = opts.maxAge;
  if (typeof maxAge === 'string') {
    if (maxAge === 'permanent') {
      maxAge = 365 * unitToSeconds.d;
    } else if (maxAge === 'no-cache') {
      maxAge = 0;
    } else if (maxAge === 'unset') {
      maxAge = undefined;
    }
  }
  maxAge = toSec(maxAge);
  if (maxAge == null) {
    response.removeHeader('Cache-Control');
    return;
  }

  const sWR_ttl = toSec(opts.staleWhileRevalidate);
  const sWR = sWR_ttl != null ? `, stale-while-revalidate=${sWR_ttl}` : '';

  const sIE_ttl = toSec(opts.staleIfError);
  const sIE = sIE_ttl != null ? `, stale-if-error=${sIE_ttl}` : '';

  maxAge = Math.round(maxAge);

  if (maxAge <= 0) {
    setCC(response, 'no-cache');
    return;
  }
  const scope = opts.publ ? 'public' : 'private';
  const stability =
    (opts.stability && stabilities[opts.stability]) || stabilities.immutable;

  eTag != null && response.setHeader('ETag', eTag);
  setCC(response, `${scope}, max-age=${maxAge + sWR + sIE + stability}`);
};
