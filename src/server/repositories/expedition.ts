import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { focusSessions, players, quests, users } from "@/server/db/schema";
import { addDays, todayInZone } from "@/lib/dates";

export const WEEK_GOAL_MIN = 420;
export const YETI_MIN = 120;
export const CLIMB_MIN = WEEK_GOAL_MIN - YETI_MIN;

export type ExpeditionMember = {
  userId: string;
  name: string;
  displayName: string;
  avatar: string;
  level: number;
  totalXp: number;
  streak: number;
  longest: number;
  shareActivity: boolean;
  lastActiveDate: string | null;
  minutes: number;
  questsDone: number;
};

export type ExpeditionActivity = {
  id: string;
  title: string;
  domain: string;
  actualMin: number | null;
  completedAt: string | null;
  displayName: string;
  avatar: string;
};

export function startOfWeek(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

export function currentWeek(timezone: string): string {
  return startOfWeek(todayInZone(timezone));
}

function weekBoundary(weekStart: string): string {
  return `${weekStart}T00:00:00.000Z`;
}

export async function getExpedition(timezone = "Europe/Amsterdam"): Promise<{
  weekStart: string;
  members: ExpeditionMember[];
  privateCount: number;
  totalMinutes: number;
  questsDone: number;
  activities: ExpeditionActivity[];
}> {
  const weekStart = currentWeek(timezone);
  const boundary = weekBoundary(weekStart);

  const [people, minutesRows, questRows, activities] = await Promise.all([
    db
      .select({
        userId: users.id,
        name: users.name,
        displayName: players.displayName,
        avatar: players.avatar,
        level: players.campLevel,
        totalXp: players.totalXp,
        streak: players.streakCount,
        longest: players.longestStreak,
        shareActivity: players.shareActivity,
        lastActiveDate: players.lastActiveDate,
      })
      .from(players)
      .innerJoin(users, eq(users.id, players.userId)),
    db
      .select({
        userId: focusSessions.userId,
        minutes: sql<number>`coalesce(sum(${focusSessions.minutes}), 0)`,
      })
      .from(focusSessions)
      .where(gte(focusSessions.endedAt, boundary))
      .groupBy(focusSessions.userId),
    db
      .select({
        userId: quests.userId,
        count: sql<number>`count(*)`,
      })
      .from(quests)
      .where(and(eq(quests.status, "done"), gte(quests.completedAt, boundary)))
      .groupBy(quests.userId),
    db
      .select({
        id: quests.id,
        title: quests.title,
        domain: quests.domain,
        actualMin: quests.actualMin,
        completedAt: quests.completedAt,
        displayName: players.displayName,
        avatar: players.avatar,
      })
      .from(quests)
      .innerJoin(players, eq(players.userId, quests.userId))
      .where(
        and(
          eq(quests.status, "done"),
          eq(players.shareActivity, 1),
          gte(quests.completedAt, boundary),
        ),
      )
      .orderBy(desc(quests.completedAt))
      .limit(12),
  ]);

  const minutesByUser = new Map(minutesRows.map((row) => [row.userId, Number(row.minutes)]));
  const questsByUser = new Map(questRows.map((row) => [row.userId, Number(row.count)]));

  const all: ExpeditionMember[] = people.map((person) => ({
    ...person,
    shareActivity: person.shareActivity === 1,
    minutes: minutesByUser.get(person.userId) ?? 0,
    questsDone: questsByUser.get(person.userId) ?? 0,
  }));

  const members = all
    .filter((member) => member.shareActivity)
    .sort((a, b) => b.minutes - a.minutes || b.questsDone - a.questsDone);

  return {
    weekStart,
    members,
    privateCount: all.length - members.length,
    totalMinutes: members.reduce((sum, member) => sum + member.minutes, 0),
    questsDone: members.reduce((sum, member) => sum + member.questsDone, 0),
    activities,
  };
}

export type AdminMember = ExpeditionMember & {
  username: string;
  role: string;
  lastLoginAt: string | null;
};

export async function getAdminOverview(timezone = "Europe/Amsterdam"): Promise<{
  weekStart: string;
  members: AdminMember[];
  totalMinutes: number;
  questsDone: number;
  daily: Array<{ date: string; minutes: number }>;
}> {
  const weekStart = currentWeek(timezone);
  const boundary = weekBoundary(weekStart);
  const from = addDays(todayInZone(timezone), -13);

  const [people, minutesRows, questRows, dailyRows] = await Promise.all([
    db
      .select({
        userId: users.id,
        username: users.username,
        role: users.role,
        lastLoginAt: users.lastLoginAt,
        name: users.name,
        displayName: players.displayName,
        avatar: players.avatar,
        level: players.campLevel,
        totalXp: players.totalXp,
        streak: players.streakCount,
        longest: players.longestStreak,
        shareActivity: players.shareActivity,
        lastActiveDate: players.lastActiveDate,
      })
      .from(players)
      .innerJoin(users, eq(users.id, players.userId)),
    db
      .select({
        userId: focusSessions.userId,
        minutes: sql<number>`coalesce(sum(${focusSessions.minutes}), 0)`,
      })
      .from(focusSessions)
      .where(gte(focusSessions.endedAt, boundary))
      .groupBy(focusSessions.userId),
    db
      .select({
        userId: quests.userId,
        count: sql<number>`count(*)`,
      })
      .from(quests)
      .where(and(eq(quests.status, "done"), gte(quests.completedAt, boundary)))
      .groupBy(quests.userId),
    db
      .select({
        date: sql<string>`substr(${focusSessions.startedAt}, 1, 10)`,
        minutes: sql<number>`coalesce(sum(${focusSessions.minutes}), 0)`,
      })
      .from(focusSessions)
      .where(gte(focusSessions.startedAt, `${from}T00:00:00.000Z`))
      .groupBy(sql`substr(${focusSessions.startedAt}, 1, 10)`),
  ]);

  const minutesByUser = new Map(minutesRows.map((row) => [row.userId, Number(row.minutes)]));
  const questsByUser = new Map(questRows.map((row) => [row.userId, Number(row.count)]));
  const dailyByDate = new Map(dailyRows.map((row) => [row.date, Number(row.minutes)]));

  const members: AdminMember[] = people
    .map((person) => ({
      ...person,
      shareActivity: person.shareActivity === 1,
      minutes: minutesByUser.get(person.userId) ?? 0,
      questsDone: questsByUser.get(person.userId) ?? 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    weekStart,
    members,
    totalMinutes: members.reduce((sum, member) => sum + member.minutes, 0),
    questsDone: members.reduce((sum, member) => sum + member.questsDone, 0),
    daily: Array.from({ length: 14 }, (_, index) => {
      const date = addDays(from, index);
      return { date, minutes: dailyByDate.get(date) ?? 0 };
    }),
  };
}

export async function setShareActivity(userId: string, share: boolean): Promise<void> {
  await db
    .update(players)
    .set({ shareActivity: share ? 1 : 0 })
    .where(eq(players.userId, userId));
}
