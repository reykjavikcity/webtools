import { ServerResponse } from 'http';

// INFORMATION

/** The client should continue the request or ignore the response if the request is already finished. */
export const HTTP_100_Continue = 100;
/** Response to an Upgrade request header from the client and indicates the protocol the server is switching to. */
export const HTTP_101_SwitchingProtocols = 101;

// SUCCESS

/** The request succeeded, and the response body contains the requested resource. */
export const HTTP_200_OK = 200;
/** The request succeeded, and a new resource was created as a result. This is typically the response sent after POST or PUT requests. */
export const HTTP_201_Created = 201;
/* The request has been received but not yet acted upon. Another process or server handles the request. */
export const HTTP_202_Accepted = 202;
/** The returned metadata is not necessarily complete. */
export const HTTP_203_NonAuthoritativeInformation = 203;
/** The response body is empty. */
export const HTTP_204_NoContent = 204;
/** The request succeeded, but the returned metadata is not necessarily complete. */
export const HTTP_206_PartialContent = 206;

// REDIRECTION

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

// CLIENT ERROR

/** The request is malformed (e.g. a URL param is of a wrong type). */
export const HTTP_400_BadRequest = 400;
/** User is not authenticated (i.e. not logged in). */
export const HTTP_401_Unauthorized = 401;
/** User is logged in but doesn't have the necessary privileges. */
export const HTTP_403_Forbidden = 403;
/** The request looks OK but the resource does not exist. */
export const HTTP_404_NotFound = 404;
/** The request method is not supported by the target resource. */
export const HTTP_405_MethodNotAllowed = 405;
/** The server can't produce a response matching the list of acceptable types. */
export const HTTP_406_NotAcceptable = 406;
/** Similar to `HTTP_401_Unauthorized` but authentication is needed to be done by a proxy. */
export const HTTP_407_ProxyAuthenticationRequired = 407;
/** The server timed out waiting for the request. */
export const HTTP_408_RequestTimeout = 408;
/** The request conflicts with the current state of the server. */
export const HTTP_409_Conflict = 409;
/** The resource has been permanently deleted from server, with no forwarding address. */
export const HTTP_410_Gone = 410;
/** The request's Content-Length header field is not defined and the server requires it. */
export const HTTP_411_LengthRequired = 411;
/** The client has indicated preconditions in its headers which the server does not meet. */
export const HTTP_412_PreconditionFailed = 412;
/** The request is larger than the server is willing or able to process. */
export const HTTP_413_PayloadTooLarge = 413;
/** The URI requested by the client is longer than the server is willing to interpret. */
export const HTTP_414_URITooLong = 414;
/** The media format of the requested data is not supported by the server */
export const HTTP_415_UnsupportedMediaType = 415;
/** The Range header field in the request cannot be fulfilled. It's possible that the range is outside the size of the target URI's data. */
export const HTTP_416_RangeNotSatisfiable = 416;
/** The expectation indicated by the Expect request header field cannot be met by the server. */
export const HTTP_417_ExpectationFailed = 417;
/** The server refuses the attempt to brew coffee with a teapot. */
export const HTTP_418_ImATeapot = 418;
/** The request was directed at a server that is not able to produce a response. */
export const HTTP_421_MisdirectedRequest = 421;
/** The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol. */
export const HTTP_426_UpgradeRequired = 426;
/** The origin server requires the request to be conditional. */
export const HTTP_428_PreconditionRequired = 428;
/** Received too many requests in a given amount of time ("rate limiting"). */
export const HTTP_429_TooManyRequests = 429;
/** The server is unwilling to process the request because its header fields are too large. */
export const HTTP_431_RequestHeaderFieldsTooLarge = 431;
/** The resource cannot legally be provided, such as a web page censored by a government. */
export const HTTP_451_UnavailableForLegalReasons = 451;

// SERVER ERROR

/** The server has encountered a situation it does not know how to handle. */
export const HTTP_500_InternalServerError = 500;
/** The request method type is not supported by the server and cannot be handled. */
export const HTTP_501_NotImplemented = 501;
/** The server, while working as a gateway to get a response needed to handle the request, got an invalid response. */
export const HTTP_502_BadGateway = 502;
/** The server is not ready to handle the request. (Commonly: down for maintenance or overloaded.) */
export const HTTP_503_ServiceUnavailable = 503;
/** The server is acting as a gateway and cannot get a response in time. */
export const HTTP_504_GatewayTimeout = 504;
/** The HTTP version used in the request is not supported by the server. */
export const HTTP_505_HTTPVersionNotSupported = 505;
/** The server has an internal configuration error: the chosen variant resource is configured to engage in transparent content negotiation itself. */
export const HTTP_506_VariantAlsoNegotiates = 506;
/** Further extensions to the request are required for the server to fulfill it. */
export const HTTP_510_NotExtended = 510;
/** The client needs to authenticate to gain network access. */
export const HTTP_511_NetworkAuthenticationRequired = 511;

// ---------------------------------------------------------------------------
// Union Types for the more commonly occurrring HTTP Status codes

export type HTTP_INFO = typeof HTTP_100_Continue | typeof HTTP_101_SwitchingProtocols;

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

export type HTTP_NOT_FOUND =
  | typeof HTTP_400_BadRequest
  | typeof HTTP_404_NotFound
  | typeof HTTP_410_Gone;

export type HTTP_BANNED = typeof HTTP_401_Unauthorized | typeof HTTP_403_Forbidden;

export type HTTP_CLIENT_ERROR = HTTP_NOT_FOUND | HTTP_BANNED;

export type HTTP_SERVER_ERROR = typeof HTTP_500_InternalServerError;

export type HTTP_ERROR = HTTP_CLIENT_ERROR | HTTP_SERVER_ERROR;

export type HTTP_STATUS =
  | HTTP_INFO_ALL
  | HTTP_SUCCESS_ALL
  | HTTP_REDIRECTION_ALL
  | HTTP_CLIENT_ERROR_ALL
  | HTTP_SERVER_ERROR_ALL;

// ---------------------------------------------------------------------------
// All HTTP Status codes, even the esoteric ones

export type HTTP_INFO_ALL = HTTP_INFO;
export type HTTP_SUCCESS_ALL =
  | HTTP_SUCCESS
  | typeof HTTP_203_NonAuthoritativeInformation
  | typeof HTTP_204_NoContent
  | typeof HTTP_206_PartialContent;
export type HTTP_REDIRECTION_ALL = HTTP_REDIRECTION;
export type HTTP_CLIENT_ERROR_ALL =
  | HTTP_CLIENT_ERROR
  | typeof HTTP_405_MethodNotAllowed
  | typeof HTTP_406_NotAcceptable
  | typeof HTTP_407_ProxyAuthenticationRequired
  | typeof HTTP_408_RequestTimeout
  | typeof HTTP_409_Conflict
  | typeof HTTP_411_LengthRequired
  | typeof HTTP_412_PreconditionFailed
  | typeof HTTP_413_PayloadTooLarge
  | typeof HTTP_414_URITooLong
  | typeof HTTP_415_UnsupportedMediaType
  | typeof HTTP_416_RangeNotSatisfiable
  | typeof HTTP_417_ExpectationFailed
  | typeof HTTP_418_ImATeapot
  | typeof HTTP_421_MisdirectedRequest
  | typeof HTTP_426_UpgradeRequired
  | typeof HTTP_428_PreconditionRequired;
export type HTTP_SERVER_ERROR_ALL =
  | HTTP_SERVER_ERROR
  | typeof HTTP_501_NotImplemented
  | typeof HTTP_502_BadGateway
  | typeof HTTP_503_ServiceUnavailable
  | typeof HTTP_504_GatewayTimeout
  | typeof HTTP_505_HTTPVersionNotSupported
  | typeof HTTP_506_VariantAlsoNegotiates
  | typeof HTTP_510_NotExtended
  | typeof HTTP_511_NetworkAuthenticationRequired;
export type HTTP_ERROR_ALL = HTTP_CLIENT_ERROR_ALL | HTTP_SERVER_ERROR_ALL;

// ---------------------------------------------------------------------------

type TimeUnit = 's' | 'm' | 'h' | 'd' | 'w';
export type TTL = number | `${number}${TimeUnit}`;
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

/**
 * Converts a `TTL` (max-age) value into seconds, and returns `0` for bad
 * and/or negative input values.
 *
 * @see https://github.com/reykjavikcity/webtools/tree/v0.1#tosec-ttl-helper
 */
export const toSec = (ttl: TTL): number => {
  if (typeof ttl === 'string') {
    const value = parseFloat(ttl);
    const factor = unitToSeconds[ttl.slice(-1) as TimeUnit] || 1;
    ttl = value * factor;
  }
  return Math.max(0, Math.round(ttl)) || 0;
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
  if (maxAge == null) {
    response.removeHeader('Cache-Control');
    return;
  }

  maxAge = toSec(maxAge);
  if (!maxAge) {
    setCC(response, 'no-cache');
    return;
  }

  const sWR_ttl = toSec(opts.staleWhileRevalidate || 0);
  const sWR = sWR_ttl ? `, stale-while-revalidate=${sWR_ttl}` : '';

  const sIE_ttl = toSec(opts.staleIfError || 0);
  const sIE = sIE_ttl ? `, stale-if-error=${sIE_ttl}` : '';

  const scope = opts.publ ? 'public' : 'private';
  const stability =
    (opts.stability && stabilities[opts.stability]) || stabilities.immutable;

  setCC(response, `${scope}, max-age=${maxAge + sWR + sIE + stability}`);

  eTag != null && response.setHeader('ETag', eTag);
};
