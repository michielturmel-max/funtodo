import "server-only";

import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { pushSubscriptions } from "@/server/db/schema";

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string | null;
};

export async function savePushSubscription(
  userId: string,
  input: PushSubscriptionInput,
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .insert(pushSubscriptions)
    .values({
      id: crypto.randomUUID(),
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
      },
    });
}

export async function removePushSubscription(userId: string, endpoint: string): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
}

export async function removePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function listPushSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
  return db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .orderBy(desc(pushSubscriptions.createdAt));
}

export async function countPushSubscriptions(userId: string): Promise<number> {
  const rows = await listPushSubscriptions(userId);
  return rows.length;
}
