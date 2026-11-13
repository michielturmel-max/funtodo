import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { activityDays, players, quests, xpEvents } from "@/server/db/schema";
import type { Domain } from "@/lib/game";
import { addDays, daysBetween, todayInZone } from "@/lib/dates";
import type { PlayerRow } from "@/server/db/schema";

export type PlayerStats = {
  totalXp: number;
  byDomain: Record<Domain, number>;
  level: number;
  coins: number;
  streak: number;
  longest: number;
  graceUsed: number;
  graceMonth: string | null;
  lastActiveDate: string | null;
};

const EMPTY_DOMAINS: Record<Domain, number> = {
  body: 0,
  mind: 0,
  craft: 0,
  social: 0,
};

export async function getPlayer(userId: string): Promise<PlayerRow> {
  const rows = await db.select().from(players).where(eq(players.userId, userId)).limit(1);
  if (rows[0]) return rows[0];

  const now = new Date().toISOString();
  const inserted = await db
    .insert(players)
    .values({
      userId,
      displayName: "Reiziger",
      timezone: "Europe/Amsterdam",
      createdAt: now,
    })
    .returning();

  return inserted[0];
}

export async function getStats(userId: string): Promise<PlayerStats> {
  const player = await getPlayer(userId);

  const grouped = await db
    .select({
      domain: xpEvents.domain,
      total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)`,
    })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))
    .groupBy(xpEvents.domain);

  const byDomain = { ...EMPTY_DOMAINS };
  for (const row of grouped) {
    if (row.domain in byDomain) {
      byDomain[row.domain as Domain] = Number(row.total);
    }
  }

  const totalXp = Object.values(byDomain).reduce((sum, value) => sum + value, 0);

  return {
    totalXp,
    byDomain,
    level: player.campLevel,
    coins: player.coins,
    streak: player.streakCount,
    longest: player.longestStreak,
    graceUsed: player.graceUsed,
    graceMonth: player.graceMonth,
    lastActiveDate: player.lastActiveDate,
  };
}

export async function getRecentActivity(userId: string, days = 14) {
  const timezone = (await getPlayer(userId)).timezone;
  const today = todayInZone(timezone);
  const from = addDays(today, -(days - 1));

  return db
    .select()
    .from(activityDays)
    .where(and(eq(activityDays.userId, userId), gte(activityDays.date, from)))
    .orderBy(desc(activityDays.date));
}

export async function getWeekSummary(userId: string) {
  const timezone = (await getPlayer(userId)).timezone;
  const today = todayInZone(timezone);
  const from = addDays(today, -6);

  const [completed, planned, focus] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(quests)
      .where(
        and(
          eq(quests.userId, userId),
          eq(quests.status, "done"),
          gte(quests.completedAt, `${from}T00:00:00`),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(quests)
      .where(and(eq(quests.userId, userId), eq(quests.isMain, 1))),
    db
      .select({ minutes: sql<number>`coalesce(sum(${quests.actualMin}), 0)` })
      .from(quests)
      .where(
        and(
          eq(quests.userId, userId),
          eq(quests.status, "done"),
          gte(quests.completedAt, `${from}T00:00:00`),
        ),
      ),
  ]);

  return {
    completed: Number(completed[0]?.count ?? 0),
    plannedMain: Number(planned[0]?.count ?? 0),
    minutes: Number(focus[0]?.minutes ?? 0),
    from,
    today,
  };
}

export function currentGap(player: PlayerRow, timezone: string): number {
  const today = todayInZone(timezone);
  return player.lastActiveDate ? daysBetween(player.lastActiveDate, today) : 0;
}
