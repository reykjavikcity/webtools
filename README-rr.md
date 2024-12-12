# @reykjavik/webtools/react-router/\* <!-- omit from toc -->

These are the [react-router (>=7)](https://reactrouter.com)-specific utilities
in the `@reykjavik/webtools` package.

**Contents:**

<!-- prettier-ignore-start -->

- [`@reykjavik/webtools/react-router/Wait`](#reykjavikwebtoolsreact-routerwait)
  - [`Wait` component](#wait-component)
  - [Type `WaitComponent`](#type-waitcomponent)
- [`@reykjavik/webtools/react-router/http`](#reykjavikwebtoolsreact-routerhttp)
  - [`isClientFetch`](#isclientfetch)

<!-- prettier-ignore-end -->

---

## `@reykjavik/webtools/react-router/Wait`

Contains a thin wrapper around
[React-Router's `Await` component](https://reactrouter.com/how-to/suspense#2-render-the-fallback-and-resolved-ui),
to provide a more ergonomic API.

---

### `Wait` component

It waits `for` a promise, renders a spinner `meanwhile`, and an `error`
message if the promise rejects.

If the awaited promise resolves to an object with a truthy `$error` property,
the error will be thrown.

```tsx
import type { Route } from './+types/test-page';
import { useAsyncError } from 'react-router';
import { Wait } from '@reykjavik/webtools/react-router/Wait';

export const loader = async (args: Route.LoaderArgs) => {
  return {
    document: getDocument().catch(() => ({
      $error: 'Failed to load document',
    })),
  };
};

export default function TestPage(props: Route.ComponentProps) {
  const { document } = props.loaderData;

  return (
    <Wait
      for={document}
      meanwhile={<p style={{ color: '#999' }}>Loading document...</p>}
      error={<CustomError />}
    >
      {(document) => (
        <div>
          <h1>{document.title}</h1>
          <p>{document.text}</p>
        </div>
      )}
    </Wait>
  );
}

// ----

const CustomError = () => {
  const error = useAsyncError();
  const errMessage = error instanceof Error ? error.message : error;
  return <p style={{ color: 'red' }}>Error: {errMessage}</p>;
};
```

**Props:**

- **`for`**`: Promise<T> | T`  
  The value you want to wait for before rendering.
- **`children`**`: (data: Exclude<T, { $error: string | number | true | object }>) => ReactNode`  
  A function to render the children when the value is resolved. (If the
  promise resolved to an object with a truthy `$error` property, then the
  `$error` is thrown and this function skipped.)
- **`meanwhile`**`?: ReactNode` — (Default: `'Loading...'`)  
  Custom loading/spinner component.
- **`error`**`?: ReactNode` — (Default: `'An error occurred.'`)  
  Custom error component if the promise is rejected or if it resolves to an
  object with an `$error` property.

---

### Type `WaitComponent`

A function component that wraps `@reykjavik/webtools/react-router/Wait` to
provide custom properties for `meanwhile` and `error` fallbacks, and/or other
behaviors.

You can pass a type parameter listing the "CustomProps" it accepts in addition
to the base `for` and `children` props of `<Wait />`.

```tsx
import { Wait, WaitComponent } from '@reykjavik/webtools/react-router/Wait';

export const MyWait: WaitComponent<{ size?: 'large' | 'small' }> = (
  props
) => {
  return (
    <Wait
      for={props.for}
      meanwhile={<CustomSpinner large={props.size === 'large'} />}
      error={<CustomError small={props.size !== 'large'} />}
    >
      {props.children}
    </Wait>
  );
};

export type MyWaitProps = Parameters<typeof MyWait>[0];
// {
//   for: Promise<T> | T;
//   children: (data: Exclude<T, { $error: string | number | true | object }>) => ReactNode;
//   // CustomProps:
//   size?: 'large' | 'small';
// }
```

---

## `@reykjavik/webtools/react-router/http`

Contains utilities to aid working with `loader` and `action` functions.

---

### `isClientFetch`

**Syntax:** `isClientFetch(request: Request): boolean`

Detects if the request is a client fetch, or an initial/full-page load.

This can be used to decide whether to await the fetched data or not.

```ts
import type { Route } from './+types/my-route-module';
import { isClientFetch } from '@reykjavik/webtools/react-router/deferring';

export const loader = async (args: Route.LoaderArgs) => {
  const document = fetchDocument();
  if (!isClientFetch(args.request)) {
    // Make the page curl-friendly by waiting for the promise to resolve
    // before rendering the page, on initial load or browser reload.
    await document;
  }

  return { document };
};
```
