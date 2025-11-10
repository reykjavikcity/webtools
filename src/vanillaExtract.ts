import { capitalize } from '@reykjavik/hanna-utils';
import { globalStyle, GlobalStyleRule, style } from '@vanilla-extract/css';

/**
 * Adds free-form CSS as a globalStyle
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#vanillaglobal
 */
export const vanillaGlobal = (css: string) =>
  globalStyle('x', { x: `} ${css} x{x:` } as GlobalStyleRule);

// ---------------------------------------------------------------------------

/**
 * Spreads the return value into a style object, to inject free-form CSS
 * properties (or nested blocks)
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#vanillaprops
 */
export const vanillaProps = (css: string) => ({ x: `; ${css}` } as GlobalStyleRule);

// ---------------------------------------------------------------------------

type ClassNameCallback = (
  /** The raw standalone class-name. (i.e. `"Component_b6ff51c"`) */
  classNameRaw: string,
  /** The class-name prefixed with a "." for convenence (i.e. `".Component_b6ff51c"`) */
  classNameSelector: string
) => string;

/**
 * Returns a scoped cssClassName styled with free-form CSS. This function is a
 * thin wrapper around vanilla-extract's `style` function.
 *
 * When you pass it a string, all `&&` tokens are automatically replaced with the
 * selector for the auto-generated class-name. Note that in such cases EVERY
 * style property must be wrapped in a selector block.
 *
 * To opt out of the `&&` replacement, use the callback function signature.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#vanillaclass
 */
export function vanillaClass(css: string | ClassNameCallback): string;
export function vanillaClass(debugId: string, css: string | ClassNameCallback): string;

export function vanillaClass(
  cssOrDebugId: string | ClassNameCallback,
  css?: string | ClassNameCallback
): string {
  const debugId = css != null ? (cssOrDebugId as string) : undefined;
  css = css != null ? css : cssOrDebugId;

  if (typeof css === 'string' && !/&&/.test(css)) {
    return style(vanillaProps(css), debugId);
  }

  const className = style({}, debugId);

  vanillaGlobal(
    typeof css === 'function'
      ? css('className', `.${className}`)
      : css.replace(/&&/g, `.${className}`)
  );

  return className;
}

// ---------------------------------------------------------------------------

/**
 * Returns an object with privately scoped CSS variables props.
 * Pass them around and use them in your CSS.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#vanillacvars
 */
export const vanillaVars = <T extends string>(...varNames: Array<T>) => {
  const id = vanillaClass(``);
  type VarObj = Record<`var${Capitalize<T>}`, string>;
  const vars = {} as VarObj & {
    /** Allows initializing all or some of the variables in CSS, without offending VSCode's CSS syntax parser too much. */
    setVars: (vars: Partial<Record<T, unknown>>) => string;
  };
  vars.setVars = (vars) =>
    Object.entries(vars)
      .map(([name, value]) => `--${id}--${name}: ${value || ''};`)
      .join('\n');

  for (const name of varNames) {
    (vars as VarObj)[`var${capitalize(name)}`] = `--${id}--${name}`;
  }
  return vars;
};
