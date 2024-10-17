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

type ClassNameCallback = (className: string, classNameSelector: string) => string;

/**
 * Returns a scoped cssClassName styled with free-form CSS
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README.md#vanillaclass
 */
export function vanillaClass(css: string | ClassNameCallback): string;
export function vanillaClass(debugId: string, css: string | ClassNameCallback): string;

export function vanillaClass(
  cssOrDebugId: string | ClassNameCallback,
  css?: string | ClassNameCallback
): string {
  const debugId = css != null ? (cssOrDebugId as string) : undefined;
  css = css != null ? css : cssOrDebugId;
  if (typeof css === 'function') {
    const className = style({}, debugId);
    vanillaGlobal(css(className, `.${className}`));
    return className;
  }
  return style(vanillaProps(css), debugId);
}

// ---------------------------------------------------------------------------

/**
 * @deprecated  (Will be removed in v0.2)
 *
 * Replaces all `&` tokens with the given selector string, in a direct
 * (read. "dumb") way. It's mainly useful when used with style-mixins, etc.
 *
 * **NOTE:** `vanillaNest` does NOT support deeply nested blocks, or anything
 * so fancy. It will also replace `&` characters inside values, comments, etc.
 * If you need something more sophisticated, use a custom `postcss` config.
 *
 * ```ts
 * // someCssHelper.ts
 * import { vanillaNest } from '@reykjavik/webtools/vanillaExtract';
 *
 * export const hoverGlow = (
 *   ampSelector: string,
 *   glowiness?: 'normal' | 'insane'
 * ) =>
 *   vanillaNest(
 *     ampSelector,
 *     `
 *     &:hover {
 *       box-shadow: 0 0 20px 5px ${
 *         glowiness === 'insane' ? 'hotpink' : 'salmon'
 *       };
 *     }
 *   `
 *   );
 *
 * // ...then, somewhere else in a *.css.ts file:
 *
 * import { hoverGlow } from '~/someCssHelper.js';
 * import { vanillaGlobal } from '@reykjavik/webtools/vanillaExtract';
 *
 * vanillaGlobal(`
 *   .MyComponent {
 *     border: 1px solid #ccc;
 *     padding: 1em;
 *   }
 *   ${hoverGlow('.MyComponent')}
 *
 *   .MyOtherComponent {
 *     border: 1px solid #ccc;
 *     padding: 1em;
 *   }
 *   ${hoverGlow('.MyOtherComponent', 'insane')}
 * `);
 * ```
 *
 * (This low-level utility function is used internally by `vanillaClassNested`.
 */
export const vanillaNest = (ampSelector: string, css: string): string =>
  css.replace(/&/g, ampSelector);

// ---------------------------------------------------------------------------

/**
 * @deprecated  (Will be removed in v0.2)
 *
 * Returns a scoped cssClassName styled with free-form CSS.
 *
 * It also automatically replaces all `&`-tokens with
 * the selector for the auto-generated class-name.
 *
 * ```ts
 * // someFile.css.ts
 * import { vanillaClassNested } from '@reykjavik/webtools/vanillaExtract';
 *
 * export const myClass = vanillaClassNested(`
 *   background-color: #ccc;
 *   padding: .5em 1em;
 *
 *   /* Nested blocks begin: *​​/
 *   &:hover {
 *     background-color: #666;
 *     color: white;
 *   }
 *   & > strong {
 *     color: maroon;
 *   }
 *   html[data-color-theme="unicorn"] & {
 *     background-color: pink;
 *   }
 * `);
 * ```
 *
 * **NOTE:** All "bare" (un-nested) style properties **must come first**,
 * before any nested blocks.
 *
 * **NOTE 2:** `vanillaClassNested` does NOT support deeply nested blocks, or
 * anything so fancy. It will also replace `&` characters inside values,
 * comments, etc. If you need something more sophisticated, use a custom
 * `postcss` config.
 */
export function vanillaClassNested(css: string): string;
/** @deprecated  (Will be removed in v0.2) */
/**
 * Returns a scoped cssClassName styled with free-form CSS.
 *
 * It also automatically replaces all `&`-tokens with
 * the selector for the auto-generated class-name.
 *
 * ```ts
 * // someFile.css.ts
 * import { vanillaClassNested } from '@reykjavik/webtools/vanillaExtract';
 *
 * export const myClass = vanillaClassNested(`
 *   background-color: #ccc;
 *   padding: .5em 1em;
 *
 *   /* Nested blocks begin: *​​/
 *   &:hover {
 *     background-color: #666;
 *     color: white;
 *   }
 *   & > strong {
 *     color: maroon;
 *   }
 *   html[data-color-theme="unicorn"] & {
 *     background-color: pink;
 *   }
 * `);
 * ```
 *
 * **NOTE:** All "bare" (un-nested) style properties **must come first**,
 * before any nested blocks.
 *
 * **NOTE 2:** `vanillaClassNested` does NOT support deeply nested blocks, or
 * anything so fancy. It will also replace `&` characters inside values,
 * comments, etc. If you need something more sophisticated, use a custom
 * `postcss` config.
 */
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
