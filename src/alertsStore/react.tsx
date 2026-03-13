import React, { ReactNode, useEffect, useState } from 'react';

import { AlertMessage } from './index.js';

type SubsScriber<AlertInfo> = (
  callback: (alerts: Array<AlertInfo>, _type: string) => void
) => () => void;

/**
 * Factory function that creates a React subscription hook and a container
 * component linked to a specific alerter store subscibe function.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#makereactsubscription
 */
/*#__NO_SIDE_EFFECTS__*/
export const makeReactSubscription = <AlertInfo,>(subscribe: SubsScriber<AlertInfo>) => {
  const useAlerter = () => {
    const [alerts, setAlerts] = useState<Array<AlertInfo>>([]);
    useEffect(() => subscribe((alerts) => setAlerts(alerts)), []);
    return alerts;
  };

  type AlertContainerProps = {
    children: (alerts: Array<AlertInfo>) => ReactNode;
  };
  const AlertsContainer = (props: AlertContainerProps) => {
    const alerts = useAlerter();
    return props.children(alerts);
  };

  return {
    useAlerter,
    AlertsContainer,
  };
};

/**
 * Helper to render an alerter alert message, which can be a simple string or a
 * more complex array of strings and objects representing links and rich (bold)
 * text formatting.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#renderalertmessage
 */
/*#__NO_SIDE_EFFECTS__*/
export const renderAlertMessage = (
  message: AlertMessage,
  linkComponent?: renderAlertMessage.LinkRenderer
): ReactNode => {
  const Link = linkComponent || 'a';
  return typeof message === 'string'
    ? message
    : message.flatMap((part, i) => {
        if (typeof part === 'string') {
          return ` ${part}`;
        }
        if (part.tag === 'a') {
          const { text, tag, ...linkProps } = part;
          return [
            ' ',
            <Link key={i} {...linkProps}>
              {text}
            </Link>,
          ];
        }
        return [' ', <part.tag key={i}>{part.text}</part.tag>];
      });
};

/**
 * Retrns a curried version of `renderAlertMessage` that uses the provided
 * `LinkComponent` for rendering links in alert messages.
 *
 * @see https://github.com/reykjavikcity/webtools/blob/v0.3/README.md#renderalertmessagewithlinkrenderer
 */
/*#__NO_SIDE_EFFECTS__*/
renderAlertMessage.withLinkRenderer =
  (LinkCompnent: renderAlertMessage.LinkRenderer) => (message: AlertMessage) =>
    renderAlertMessage(message, LinkCompnent);

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace renderAlertMessage {
  type LinkRendererProps = Omit<
    Extract<AlertMessage[number], { tag: 'a' }>,
    'tag' | 'text'
  > & { children: ReactNode };

  export type LinkRenderer = (props: LinkRendererProps) => ReactNode;
}
