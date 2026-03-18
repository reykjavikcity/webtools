import { dumbId, ObjectFromEntries } from '@reykjavik/hanna-utils';
import * as v from 'valibot';

const messageSchema = v.union([
  v.string(),
  v.array(
    v.union([
      // text nodes
      v.string(),
      // link elements
      v.object({
        tag: v.literal('a'),
        text: v.string(),
        href: v.string(),
        target: v.optional(v.string()),
        hrefLang: v.optional(v.string()),
        lang: v.optional(v.string()),
      }),
      // line break elements
      v.object({
        tag: v.literal('br'),
      }),
      // strong/bold elements
      v.object({
        tag: v.picklist(['strong', 'em']),
        text: v.string(),
      }),
    ])
  ),
]);

export type AlertMessage = v.InferOutput<typeof messageSchema>;

type _AlertNotification<Level, Type, Flag, Title> = {
  level: Level;
  message: AlertMessage;
  flags?: Array<Flag>;
  duration?: number;
  id: string;
} & (Title extends true ? { title?: string } : unknown) &
  (string extends Type ? unknown : { type?: Type });
type _AlertNotificationPending<Level, Type, Flag, Title> = {
  showAt: number;
} & _AlertNotification<Level, Type, Flag, Title>;

// ---------------------------------------------------------------------------

const DEFAULT_KEY = 'app~alerts';

const defaultAlertLevels = ['info', 'warning', 'success', 'error'] as const;

const defaultDurations = {
  BLINK: 2_000,
  SHORT: 4_000,
  MEDIUM: 8_000,
  LONG: 16_000,
  XLONG: 32_000,
  INDEFINITE: 0,
};

const DEFAULT_DEFAULT_DURATION = 'MEDIUM' satisfies keyof typeof defaultDurations;

/**
 * A configuration object for the `createAlerter` factory function, that allows
 * the customization of all of the accepted alert values and durations.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#type-alerterconfig
 */
export type AlerterConfig<
  Level extends string = (typeof defaultAlertLevels)[number],
  Type extends string = string,
  Flag extends string = string,
  Title extends boolean = false,
  Duration extends string = keyof typeof defaultDurations,
  Durations extends Record<Duration, number> = Record<Duration, number>
> = {
  /**
   * Identifier for the alerts store, used to create the key to persist alerts
   * in `sessionStorage` (or other provided storage).
   *
   * Only required if you need to create multiple independent alert stores in
   * the same app.
   *
   * Default: `"app~alerts"`
   */
  key?: string;

  /**
   * The allowed alert "levels". The returned `alerter` object will have a
   * named dispatcher method for each level.
   *
   * Default: `['info', 'warning', 'success', 'error']`
   */
  levels?: Array<Level>;

  /**
   * The allowed alert "types", which can be used to, for example, to dispatch
   * both "toasts" vs. "static alert banners" via the same store.
   *
   * This can also be used for more basic styling or categorization purposes.
   *
   * Default: `[ ]`  (No types and the `type` property not allowed).
   */
  types?: Array<Type>;

  /**
   * The allowed alert "flags", which can be changed during the lifetime of
   * an alert using the `setFlags` function on the `AlertInfo` object.
   *
   * This can be used for styling or any other purpose you like.
   *
   * Default: no restriction, any string value is allowed.
   */
  flags?: Array<Flag>;

  /**
   * Optionally controls the allowed alert "duration" names and their lengths
   * in milliseconds.
   *
   * Default:
   * ```ts
   *  {
        BLINK: 2_000,
        SHORT: 4_000,
        MEDIUM: 8_000,
        LONG: 16_000,
        XLONG: 32_000,
        INDEFINITE: 0,
      }
    * ```
    */
  durations?: Durations;

  /**
   * Default duration to use for alerts if no duration is specified when
   * dispatching.
   *
   * You can also pass an object with different default durations for each
   * alert level, e.g. longer defaults for "errors" than "success" alerts.
   *
   * Default: `MEDIUM` if using the default durations, otherwise the default
   * is `0` (indefinite)
   */
  defaultDuration?:
    | (Durations extends Record<infer D, number> ? (D extends string ? D : never) : never)
    | Record<
        Level,
        Durations extends Record<infer D, number> ? (D extends string ? D : never) : never
      >;

  /**
   * Whether to allow an optional `title` property on alerts.
   *
   * Default: `false`.
   */
  title?: Title;

  /**
   * Optional custom storage object to use instead of `sessionStorage` (the
   * default) for persisting alerts across page reloads, etc.
   */
  storage?: {
    getItem: (key: string) => string | undefined | null;
    setItem: (key: string, value: string) => void;
  };
};

const storeKeys: Record<string, true> = {};

/**
 * Factory function that creates an alerter store singleton with optional
 * configuration for the genarated alerts.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#createalerterstore
 */
/*#__NO_SIDE_EFFECTS__*/
// eslint-disable-next-line complexity
export const createAlerterStore = <
  Level extends string = (typeof defaultAlertLevels)[number],
  Type extends string = string,
  Flag extends string = string,
  Title extends boolean = false,
  Duration extends string = keyof typeof defaultDurations
>(
  cfg: AlerterConfig<Level, Type, Flag, Title, Duration> = {}
) => {
  const STORE_KEY = cfg.key || DEFAULT_KEY;

  if (storeKeys[STORE_KEY]) {
    throw new Error(`An alerter store with key "${STORE_KEY}" already exists.`);
  }
  storeKeys[STORE_KEY] = true;

  const storgae =
    cfg.storage || (typeof sessionStorage !== 'undefined' ? sessionStorage : undefined);

  const alertLevels = cfg.levels || (defaultAlertLevels as unknown as Array<Level>);
  const durations =
    cfg.durations || (defaultDurations as unknown as Record<Duration, number>);

  const defaultDurationsByLevel =
    cfg.defaultDuration && typeof cfg.defaultDuration !== 'string'
      ? cfg.defaultDuration
      : undefined;

  const defaultDuration = !cfg.durations
    ? (DEFAULT_DEFAULT_DURATION as Duration)
    : typeof cfg.defaultDuration === 'string'
    ? cfg.defaultDuration
    : undefined;

  const _notificationSchema = v.object({
    level: v.picklist(alertLevels),
    title: cfg.title ? v.optional(v.string()) : v.never(),
    message: messageSchema,
    type: cfg.types && cfg.types.length ? v.optional(v.picklist(cfg.types)) : v.never(),
    flags: v.optional(v.array(cfg.flags ? v.picklist(cfg.flags) : v.string())),
    duration: v.optional(v.number()),
    id: v.string(),
  });

  const alertsSchema = v.object({
    active: v.array(_notificationSchema),
    pending: v.array(
      v.intersect([_notificationSchema, v.object({ showAt: v.number() })])
    ),
  });

  type AlertNotification = _AlertNotification<Level, Type, Flag, Title>;
  type AlertNotificationPending = _AlertNotificationPending<Level, Type, Flag, Title>;

  type AlertState = {
    active: Array<AlertInfo>;
    pending: Array<AlertNotificationPending>;
  };
  /** Global array of inflight alert notifications */
  const alerts: AlertState = {
    active: [],
    pending: [],
  };

  const _saveAlertsToStorage = storgae
    ? () => storgae.setItem(STORE_KEY, JSON.stringify(alerts))
    : () => undefined;

  // ---------------------------------------------------------------------------

  /** Array of callbacks to call whenever alerts are activated or cleared */
  const subscriptions: Array<AlertEventCallback> = [];

  let isEmitting: ReturnType<typeof setTimeout>;
  /** Calls all subscribed callbacks with the currently active alerts and the event type. */
  const emitEvent = (
    meta: { type: EventType; ids: Array<string> },
    callback?: AlertEventCallback
  ) => {
    if (callback) {
      setTimeout(() => callback(alerts.active, meta));
      return;
    }
    _saveAlertsToStorage();
    clearTimeout(isEmitting);
    // For consistency, always delay pinging the subscribed callbacks until next tick.
    isEmitting = setTimeout(() => {
      subscriptions.forEach((callback) => {
        callback(alerts.active, meta);
      });
    });
  };

  const clearAlert = (id: string) => {
    let found = false as boolean;
    alerts.active.some((alert, idx) => {
      if (alert.id === id) {
        alerts.active = alerts.active.toSpliced(idx, 1);
        found = true;
        return true;
      }
    });
    alerts.pending.some((alert, idx) => {
      if (alert.id === id) {
        alerts.pending = alerts.pending.toSpliced(idx, 1);
        found = true;
        return true;
      }
    });
    if (found) {
      emitEvent({ type: 'clear', ids: [id] });
    }
  };

  // ---------------------------------------------------------------------------

  const _unsubscribe = (callback: AlertEventCallback) => {
    const idx = subscriptions.indexOf(callback);
    if (idx > -1) {
      subscriptions.splice(idx, 1);
    }
  };

  type AlertInfo = AlertNotification & {
    /** Dispatcher function that dismisses/hides/removes the callback */
    dismiss: () => void;
    /**
     * Dispatcher function that can be used to set a simple "flag" on the alert,
     * which can be used for styling or other purposes.
     */
    setFlags: (
      value:
        | Flag
        | Array<Flag>
        | ((flags: Array<Flag> | undefined) => Array<Flag> | undefined)
    ) => void;
  };

  type EventType = 'add' | 'clear' | 'change';

  type AlertEventCallback = (
    /** Up to date Array of active alert notifications at the time of the event. */
    notifications: Array<AlertInfo>,
    /* Metadata about the event that triggered the callback. */
    meta: {
      type: EventType;
      /** IDs of the alerts that were added or cleared in this event. */
      ids: Array<string>;
    }
  ) => void;

  const subscribe = (callback: AlertEventCallback) => {
    if (subscriptions.indexOf(callback) === -1) {
      subscriptions.push(callback);
      // Should we allow opting-out of immediate invocations via function param?
      if (alerts.active.length) {
        emitEvent(
          {
            type: 'add',
            ids: alerts.active.map((t) => t.id),
          },
          callback
        );
      }
    }
    return () => _unsubscribe(callback);
  };

  // ---------------------------------------------------------------------------

  const buildNotification = (
    _payload: AlertPayload,
    level: Level
  ): (AlertNotification & { showAt?: undefined }) | AlertNotificationPending => {
    // Strip away duration and delay (not part of the notification object)
    const { duration, delay, ...payload } = _payload;
    const durationMs: number | undefined =
      durations[
        duration ||
          (defaultDurationsByLevel &&
            (defaultDurationsByLevel[level] as unknown as Duration)) ||
          ((defaultDuration || '') as Duration)
      ];

    return {
      ...payload,
      level,
      id: dumbId(), // Make unique ID for the notification
      ...(durationMs && { duration: durationMs }),
      ...(delay && delay > 50 && { showAt: Date.now() + delay }),
    };
  };

  // add dismiss and setFlags dispatcher functions
  // this way they stay stable across updates to the same alert, which can be useful for UI components that want to update or dismiss an alert after it's been rendered.
  const addMethodsToAlertInfo = (notification: AlertNotification): AlertInfo => {
    const id = notification.id;
    return {
      ...notification,
      dismiss: () => clearAlert(id),
      setFlags: (value) => {
        const notification = alerts.active.find((t) => t.id === id);
        if (!notification) {
          return;
        }
        const oldFlags = notification.flags;
        const flags =
          typeof value === 'string'
            ? [value]
            : Array.isArray(value)
            ? [...value]
            : value(notification.flags);
        if (flags === oldFlags) {
          return;
        }
        alerts.active = alerts.active.toSpliced(
          alerts.active.findIndex((t) => t.id === id),
          1,
          { ...notification, flags }
        );
        emitEvent({ type: 'change', ids: [id] });
      },
    };
  };

  const preparePendingAlertActivation = ({ id, showAt }: AlertNotificationPending) => {
    setTimeout(() => {
      const idx = alerts.pending.findIndex((t) => t.id === id);
      if (idx === -1) {
        return;
      }
      // Find and remove the pending in alert in one fell swoop
      const { showAt, ...clonedAsActive } = alerts.pending.splice(idx, 1)[0]!;
      alerts.active = [...alerts.active, addMethodsToAlertInfo(clonedAsActive)];
      emitEvent({ type: 'add', ids: [id] });
    }, showAt - Date.now());
  };

  const _addAlert = (payload: AlertPayload | AlertMessage, level: Level) => {
    const _payload =
      typeof payload === 'string' || Array.isArray(payload)
        ? ({ message: payload } as AlertPayload)
        : payload;
    const notification = buildNotification(_payload, level);
    if (!notification.showAt) {
      // Notification starts active. Clone the array.
      alerts.active = [...alerts.active, addMethodsToAlertInfo(notification)];
      emitEvent({ type: 'add', ids: [notification.id] });
      return;
    }

    // Set up delayed dispatch of the notification
    // Store it as pending
    alerts.pending.push(notification);
    // Persist the updated alerts state immediately
    _saveAlertsToStorage();
    // Set up a timer for make it active
    preparePendingAlertActivation(notification);
  };

  // ---------------------------------------------------------------------------

  type AlertPayload = {
    /**
     * A simple string containing the alert message.
     *
     * For sightly more complex alert messages pass an array of strings
     * (representing text nodes), objects with `tag: 'a'` and hyperlink-related
     * props, or `tag: 'strong'` objects for minimal rich formatting.
     *
     * (Assume that such array itmes will be rendered with whitespace between
     * them.)
     */
    message: AlertMessage;
    /**
     * Flag values can be changed during the lifetime of
     * an alert using the `setFlags` function on each `AlertInfo` object.
     *
     * Flags may be used for styling or any other purpose you like.
     */
    flags?: Array<Flag>;
    /**
     * Hint for how long the notification should remain displayed before
     * auto-dismissing.
     *
     * **NOTE:** The alerter store does not implement auto-dismissing. However,
     * this value can be used by UI component that actually render the alert,
     * by calling each `AlertInfo`'s `dismiss` method.
     */
    duration?: Duration;
    delay?: number; // delay dispatching the notification in ms
  } & (Title extends true
    ? {
        /**
         * Optional title to accompany the alert message.
         */
        title?: string;
      }
    : unknown) &
    (string extends Type
      ? unknown
      : {
          /**
           * Allows distinguishing between different "types" of alerts, for example,
           * to dispatch both "toasts" vs. "static alert banners" via the same store.
           *
           * May also be used for more basic styling or categorization purposes.
           */
          type?: Type;
        });

  const alerter = ObjectFromEntries(
    alertLevels.map((level) => [
      level,
      (payload: AlertMessage | AlertPayload) => _addAlert(payload, level),
    ])
  );

  // ---------------------------------------------------------------------------

  // On module load, read saved alerts from the storage (def. `sessionStorage`),
  // if available.
  // This allows us to persist alerts across page reloads,
  // but NOT across tabs or browser sessions.
  storgae &&
    (() => {
      const storedAlerts = storgae.getItem(STORE_KEY);
      if (!storedAlerts) {
        return;
      }
      try {
        // NOTE: This TypeAssertion is wrong rn and only becomes true after
        // `addMethodsToAlertInfo` is called on the active alerts.
        // Also TS has a hard time understanding the dynamically generated
        // schema and that they're actually correct in terms of the configuration
        // type params `Level`, `Type` and `Flag`.
        const paesed = v.parse(
          alertsSchema,
          JSON.parse(storedAlerts)
        ) as unknown as AlertState;

        alerts.pending = paesed.pending;
        alerts.active = paesed.active.map(addMethodsToAlertInfo);
      } catch (e) {
        console.error('Failed to parse stored alerts:', e);
        return;
      }
      const now = Date.now();
      const newActive: Array<AlertNotificationPending> = [];
      // Check pending alerts and set up timers, unless they should already
      // be active, in which case move them to active immediately.
      alerts.pending = alerts.pending.filter((alert) => {
        if (alert.showAt <= now) {
          // Remove pending alerts that should now be active. Store them in `newActive`
          newActive.push(alert);
          return false;
        }
        // Keep the rest, and set up timers to activate them later.
        preparePendingAlertActivation(alert);
        return true;
      });
      // Append `newActive` to the active alerts array
      alerts.active.push(
        ...newActive
          // Make sure alerts with earlier `showAt` are shown first
          .sort((a, b) => a.showAt - b.showAt)
          // remove showAt, not part of active alerts
          .map(({ showAt, ...rest }) => addMethodsToAlertInfo(rest))
      );
      // Save the (possibly) cleaned up alerts back to the storage, because why not. :-D
      _saveAlertsToStorage();
    })();

  return {
    /**
     * Singleton object with methods for showing alerts of different levels.
     * Pass a payload object to the method of the level you want to dispatch,
     * and the alert will be added to the store.
     *
     * Use `subscribeToAlerts` elsewhere in the app to subscribe to alert
     * notifications and display them.
     *
     * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#createalerterstore
     */
    alerter,

    /**
     * Subscribes to alert events. The provided callback will be called whenever a
     * alert is added or cleared.
     *
     * The callback is called immediately upon subscription if there are already
     * active alerts.
     *
     * Returns an unsubscribe function that can be called to stop receiving alert
     * events.
     *
     * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#createalerterstore
     */
    subscribe,
  };
};

/**
 * Utility type for inferring the payload shape of the dispatching methods of a
 * specific `alerter` singleton.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#createalerterstore
 */
export type InferAlerterPayload<F extends Record<string, (...args: Array<any>) => void>> =
  F extends Record<string, (payload: infer P) => void>
    ? Extract<P, { message: unknown }>
    : never;

/**
 * Utility type for inferring the alert info object shape received by the
 * callbacks of a specific alerter `subscribe` function.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#createalerterstore
 */
export type InferSubscriberAlerts<
  F extends (callback: (alerts: Array<unknown>, meta: unknown) => void) => () => void
> = F extends (callback: (alerts: Array<infer A>) => void) => () => void ? A : never;
