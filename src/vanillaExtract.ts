import { globalStyle, GlobalStyleRule, style } from '@vanilla-extract/css';

/**
 * Adds free-form CSS as a globalStyle
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#vanillaglobal
 */
export const vanillaGlobal = (css: string) =>
  globalStyle('x', { x: `} ${css} x{x:` } as GlobalStyleRule);

// ---------------------------------------------------------------------------

/**
 * Spreads the return value into a style object, to inject free-form CSS
 * properties (or nested blocks)
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#vanillaprops
 */
export const vanillaProps = (css: string) => ({ x: `; ${css}` } as GlobalStyleRule);

// ---------------------------------------------------------------------------

/**
 * Returns a scoped cssClassName styled with free-form CSS
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#vanillaclass
 */
export function vanillaClass(css: string): string;
export function vanillaClass(debugId: string, css: string): string;

export function vanillaClass(cssOrDebugId: string, css?: string): string {
  const debugId = css != null ? cssOrDebugId : undefined;
  css = css != null ? css : cssOrDebugId;
  return style(vanillaProps(css), debugId);
}

// ---------------------------------------------------------------------------

/**
 * Replaces all `&` tokens with the given selector string, in a direct
 * (read. "dumb") way. It's mainly useful when used with style-mixins, etc.
 *
 * NOTE: It does NOT support deeply nested blocks, or anything so fancy.
 * It will also replace "&" characters inside values, comments, etc.
 * If you need something more sophisticated, use a custom `postcss` config.
 *
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#vanillanest
 */
export const vanillaNest = (ampSelector: string, css: string): string =>
  css.replace(/&/g, ampSelector);

// ---------------------------------------------------------------------------

/**
 * Returns a scoped cssClassName styled with free-form CSS.
 *
 * It also automatically replaces all `&`-tokens with
 * the selector for the auto-generated class-name.
 *
 * NOTE: All "bare" (un-nested) style properties must come first,
 * before any nested blocks.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#vanillaclassnested
 */
export function vanillaClassNested(css: string): string;
export function vanillaClassNested(debugId: string, css: string): string;

export function vanillaClassNested(cssOrDebugId: string, css?: string): string {
  const debugId = css != null ? cssOrDebugId : undefined;
  css = css != null ? css : cssOrDebugId;
  const nestPoint = css.indexOf('&');
  const bareStyles = nestPoint > -1 ? css.slice(0, nestPoint) : css;
  const nestedStyles = nestPoint > -1 ? css.slice(nestPoint) : undefined;

  const className = style(vanillaProps(bareStyles), debugId);
  if (nestedStyles) {
    vanillaGlobal(vanillaNest(`.${className}`, nestedStyles));
  }
  return className;
}
