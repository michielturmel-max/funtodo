import "server-only";

import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/server/db";
import { players, pushDeliveries, quests } from "@/server/db/schema";
import { dateInZone, timeInZone } from "@/lib/dates";
import { sendPushToUser } from "./send";

const TICK_MS = 30_000;
const WINDOW_MIN = 4;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function runDuePushReminders(now = new Date()): Promise<void> {
  const rows = await db
    .select({
      id: quests.id,
      userId: quests.userId,
      title: quests.title,
      scheduledDate: quests.scheduledDate,
      scheduledTime: quests.scheduledTime,
      snoozeUntil: quests.snoozeUntil,
      timezone: players.timezone,
    })
    .from(quests)
    .innerJoin(players, eq(players.userId, quests.userId))
    .where(
      and(
        isNotNull(quests.scheduledDate),
        isNotNull(quests.scheduledTime),
        inArray(quests.status, ["planned", "active"]),
      ),
    );

  const perZone = new Map<string, { today: string; yesterday: string; minutes: number }>();

  for (const quest of rows) {
    if (!quest.scheduledDate || !quest.scheduledTime) continue;

    let targetDate = quest.scheduledDate;
    let targetTime = quest.scheduledTime;

    if (quest.snoozeUntil) {
      const until = new Date(quest.snoozeUntil);
      if (!Number.isNaN(until.getTime())) {
        if (until.getTime() > now.getTime()) continue;
        targetDate = dateInZone(until, quest.timezone);
        targetTime = timeInZone(until, quest.timezone);
      }
    }

    let zone = perZone.get(quest.timezone);
    if (!zone) {
      const today = dateInZone(now, quest.timezone);
      const yesterday = dateInZone(new Date(now.getTime() - 86_400_000), quest.timezone);
      const [hours, minutes] = timeInZone(now, quest.timezone).split(":").map(Number);
      zone = { today, yesterday, minutes: hours * 60 + minutes };
      perZone.set(quest.timezone, zone);
    }

    const target = toMinutes(targetTime);
    const sameDay = targetDate === zone.today && zone.minutes >= target;
    const justAfterMidnight =
      targetDate === zone.yesterday && zone.minutes + 1440 - target <= WINDOW_MIN;
    const inWindow = sameDay
      ? zone.minutes - target <= WINDOW_MIN
      : justAfterMidnight;

    if (!inWindow) continue;

    const key = `${targetDate}:${quest.id}:${targetTime}`;
    const inserted = await db
      .insert(pushDeliveries)
      .values({
        id: key,
        userId: quest.userId,
        questId: quest.id,
        sentAt: now.toISOString(),
      })
      .onConflictDoNothing()
      .returning({ id: pushDeliveries.id });

    if (inserted.length === 0) continue;

    await sendPushToUser(quest.userId, {
      title: "Wekker · Funtodo",
      body: `Tijd voor: ${quest.title}`,
      url: "/vandaag",
      tag: `funtodo-${quest.id}`,
      kind: "alarm",
    });
  }
}

const globalForPush = globalThis as unknown as { __funtodoPushScheduler?: boolean };

export function startPushScheduler(): void {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (globalForPush.__funtodoPushScheduler) return;
  globalForPush.__funtodoPushScheduler = true;

  const tick = () => {
    void runDuePushReminders().catch((error) => {
      console.warn("Push planner mislukt", error);
    });
  };

  setTimeout(tick, 4_000);
  setInterval(tick, TICK_MS);
}
