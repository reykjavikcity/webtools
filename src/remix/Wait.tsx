import React, { ReactElement, ReactNode, Suspense } from 'react';
import { Await } from '@remix-run/react';

type WaitPropsBase<T> = {
  /**
   * The value you want to wait for before rendering
   */
  for: Promise<T> | T;
  /**
   * A function to render the children when the value is resolved.
   *
   * (If the promise resolved to an object with a truthy `$error` property,
   * then the `$error` is thrown and this function skipped.)
   */
  children: (data: Exclude<T, { $error: string | number | true | object }>) => ReactNode;
};

type WaitFallbacks = {
  /**
   * Custom loading/spinner component.
   */
  meanwhile?: ReactNode;
  /**
   * Custom error component if the promise is rejected or if it resolves to an
   * object with an `error` property.
   */
  error?: ReactNode;
};

// ---------------------------------------------------------------------------

export type WaitProps<T> = WaitPropsBase<T> & WaitFallbacks;

/**
 * A function component that wraps `@reykjavik/webtools/remix/Wait` to provide
 * custom properties for `meanwhile` and `error` fallbacks, and/or other
 * behaviors.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README-remix.md#type-waitcomponent
 */
export type WaitComponent<
  CustomProps extends Record<string, unknown> = Record<never, never>
> = (<T>(props: WaitPropsBase<T> & CustomProps) => ReactElement) & {
  displayName?: string;
};

/**
 * Wrapper around [Remix's `Await`](https://remix.run/docs/en/2/components/await)
 * component, to provide a more ergonomic API.
 *
 * If the awaited promise (`props.for`) resolves to an object with a truthy
 * `$error` property, the `$error` will be thrown.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.1/README-remix.md#wait-component
 */
export const Wait: WaitComponent<WaitFallbacks> = (props) => (
  <Suspense fallback={props.meanwhile || 'Loading...'}>
    <Await resolve={props.for} errorElement={props.error || 'An error occurred.'}>
      {(value) => {
        if (
          value && // eslint-disable-line @typescript-eslint/no-unnecessary-condition
          typeof value === 'object' &&
          '$error' in value &&
          value.$error
        ) {
          throw value.$error;
        }
        return props.children(
          value as Exclude<typeof value, { $error: string | true | number | object }>
        );
      }}
    </Await>
  </Suspense>
);
