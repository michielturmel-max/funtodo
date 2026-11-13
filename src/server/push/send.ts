import "server-only";

import webpush from "web-push";
import { getVapidKeys, vapidSubject } from "./vapid";
import {
  listPushSubscriptions,
  removePushSubscriptionByEndpoint,
} from "@/server/repositories/push";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  kind?: "alarm" | "test";
};

let configured = false;

function configure() {
  if (configured) return;
  const keys = getVapidKeys();
  webpush.setVapidDetails(vapidSubject(), keys.publicKey, keys.privateKey);
  configured = true;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  const subscriptions = await listPushSubscriptions(userId);
  if (subscriptions.length === 0) return { sent: 0, removed: 0 };

  configure();
  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          body,
        );
        return "sent" as const;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscriptionByEndpoint(subscription.endpoint);
          return "removed" as const;
        }
        console.warn("Push verzenden mislukt", statusCode ?? error);
        return "failed" as const;
      }
    }),
  );

  let sent = 0;
  let removed = 0;
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    if (result.value === "sent") sent += 1;
    if (result.value === "removed") removed += 1;
  }

  return { sent, removed };
}
