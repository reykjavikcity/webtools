# @reykjavik/webtools/remix/\*

These are the [Remix.run](https://remix.run)-specific utilities in the
`@reykjavik/webtools` package.

**Contents:**

<!-- prettier-ignore-start -->

- [`@reykjavik/webtools/remix/Wait`](#reykjavikwebtoolsremixwait)
  - [`Wait` component](#wait-component)
  - [Type `WaitComponent`](#type-waitcomponent)
- [`@reykjavik/webtools/remix/http`](#reykjavikwebtoolsremixhttp)
  - [`isClientFetch`](#isclientfetch)

<!-- prettier-ignore-end -->

---

## `@reykjavik/webtools/remix/Wait`

Contains a wraoper around
[Remix's `Await` component](https://remix.run/docs/en/main/components/await),
to provide a more ergonomic API.

---

### `Wait` component

Waits `for` a promise, renders a spinner `meanwhile` and `error` message if
the promise rejects.

If the awaited promise resolves to an object with a truthy `$error` property,
the error will be thrown.

```tsx
import { defer, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useAsyncError } from '@remix-run/react';

import { Wait } from '@reykjavik/webtools/remix/Wait';

export const loader = async (args: LoaderFunctionArgs) => {
  return defer({
    document: getDocument().catch(() => ({
      $error: 'Failed to load document',
    })),
  });
};

export default function TestPage() {
  const { document } = useLoaderData<typeof loader>();

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

const CustomError = (props: SizeProps) => {
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
  object with an `error` property.

---

### Type `WaitComponent`

A function component that wraps `@reykjavik/webtools/remix/Wait` to provide
custom properties for `meanwhile` and `error` fallbacks, and/or other
behaviors.

You can pass a type parameter listing the "CustomProps" it accepts in addition
to the base `for` and `children` props of `<Wait />`.

```tsx
import { Wait, WaitComponent } from '@reykjavik/webtools/remix/Wait';

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

## `@reykjavik/webtools/remix/http`

Contains utilities to aid working with `loader` and `action` functions.

---

### `isClientFetch`

**Syntax:** `isClientFetch(request: Request): boolean`

Detects if the request is a client fetch, or an initial/full-page load.

This can be used to decide whether to defer data fetching or not.

```ts
import { defer, LoaderFunctionArgs } from '@remix-run/node';

import { isClientFetch } from '@reykjavik/webtools/remix/deferring';

export const loader = async (args: LoaderFunctionArgs) => {
  const document = fetchDocument();
  if (!isClientFetch(args.request)) {
    // Make the page curl-friendly by waiting for the promise to resolve
    // before rendering the page, on initial load or browser reload.
    await document;
  }

  return defer({ document });
};
```
