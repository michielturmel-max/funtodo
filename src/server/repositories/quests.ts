import "server-only";

import crypto from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, lt, lte, ne, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  activityDays,
  focusSessions,
  players,
  quests,
  subtasks,
  xpEvents,
} from "@/server/db/schema";
import type { QuestRow, SubtaskRow } from "@/server/db/schema";
import type { Domain } from "@/lib/game";
import { advanceStreak, bossHpFor, calculateQuestXp } from "@/lib/game";
import { addDays, daysBetween, todayInZone } from "@/lib/dates";
import { getPlayer } from "./player";

export type QuestWithSubtasks = QuestRow & { subtasks: SubtaskRow[] };

async function withSubtasks(rows: QuestRow[]): Promise<QuestWithSubtasks[]> {
  if (rows.length === 0) return [];
  const children = await db
    .select()
    .from(subtasks)
    .where(inArray(subtasks.questId, rows.map((row) => row.id)))
    .orderBy(asc(subtasks.position));

  const grouped = new Map<string, SubtaskRow[]>();
  for (const child of children) {
    const list = grouped.get(child.questId) ?? [];
    list.push(child);
    grouped.set(child.questId, list);
  }

  return rows.map((row) => ({ ...row, subtasks: grouped.get(row.id) ?? [] }));
}

export async function moveOverdueToInbox(userId: string, today: string): Promise<void> {
  await db
    .update(quests)
    .set({
      scheduledDate: null,
      plannedAt: null,
      status: "planned",
      scheduledTime: null,
      snoozeUntil: null,
    })
    .where(
      and(
        eq(quests.userId, userId),
        inArray(quests.status, ["planned", "active"]),
        lt(quests.scheduledDate, today),
      ),
    );
}

export async function getTodayQuests(userId: string, date: string): Promise<QuestWithSubtasks[]> {
  const rows = await db
    .select()
    .from(quests)
    .where(
      and(
        eq(quests.userId, userId),
        eq(quests.scheduledDate, date),
        ne(quests.status, "dropped"),
      ),
    )
    .orderBy(desc(quests.isMain), asc(quests.status), asc(quests.createdAt));

  return withSubtasks(rows);
}

export async function getInbox(userId: string): Promise<QuestWithSubtasks[]> {
  const rows = await db
    .select()
    .from(quests)
    .where(
      and(eq(quests.userId, userId), isNull(quests.scheduledDate), eq(quests.status, "planned")),
    )
    .orderBy(desc(quests.createdAt))
    .limit(30);

  return withSubtasks(rows);
}

export async function getAllQuests(userId: string): Promise<QuestWithSubtasks[]> {
  const rows = await db
    .select()
    .from(quests)
    .where(eq(quests.userId, userId))
    .orderBy(desc(quests.createdAt))
    .limit(120);

  return withSubtasks(rows);
}

export async function getBosses(userId: string): Promise<QuestWithSubtasks[]> {
  const rows = await db
    .select()
    .from(quests)
    .where(
      and(
        eq(quests.userId, userId),
        eq(quests.status, "planned"),
        sql`${quests.bossHp} > 0`,
      ),
    )
    .orderBy(desc(quests.bossHp))
    .limit(6);

  return withSubtasks(rows);
}

export async function getQuest(userId: string, id: string): Promise<QuestWithSubtasks | null> {
  const rows = await db
    .select()
    .from(quests)
    .where(and(eq(quests.id, id), eq(quests.userId, userId)))
    .limit(1);

  if (!rows[0]) return null;
  const [withChildren] = await withSubtasks(rows);
  return withChildren;
}

export async function getRecentDone(userId: string, limit = 8): Promise<QuestWithSubtasks[]> {
  const rows = await db
    .select()
    .from(quests)
    .where(and(eq(quests.userId, userId), eq(quests.status, "done")))
    .orderBy(desc(quests.completedAt))
    .limit(limit);

  return withSubtasks(rows);
}

export async function countForDate(userId: string, date: string) {
  const rows = await db
    .select({
      total: sql<number>`count(*)`,
      main: sql<number>`coalesce(sum(${quests.isMain}), 0)`,
      done: sql<number>`coalesce(sum(case when ${quests.status} = 'done' then 1 else 0 end), 0)`,
    })
    .from(quests)
    .where(and(eq(quests.userId, userId), eq(quests.scheduledDate, date)))
    .groupBy(quests.userId);

  const row = rows[0];
  return {
    total: Number(row?.total ?? 0),
    main: Number(row?.main ?? 0),
    done: Number(row?.done ?? 0),
  };
}

export async function createQuest(input: {
  userId: string;
  title: string;
  nextAction: string;
  domain: Domain;
  difficulty: number;
  importance: number;
  estimateMin: number;
  scheduledDate: string | null;
  scheduledTime?: string | null;
  isMain: boolean;
  subtaskTitles?: string[];
}): Promise<{ ok: true; quest: QuestRow } | { ok: false; error: string }> {
  if (input.scheduledDate) {
    const counts = await countForDate(input.userId, input.scheduledDate);
    if (counts.total >= 4) {
      return { ok: false, error: "Deze dag heeft al vier stops. Houd het klein." };
    }
    if (input.isMain && counts.main >= 1) {
      return { ok: false, error: "Er is al een hoofdquest voor deze dag." };
    }
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(quests).values({
    id,
    userId: input.userId,
    title: input.title,
    nextAction: input.nextAction,
    domain: input.domain,
    difficulty: input.difficulty,
    importance: input.importance,
    estimateMin: input.estimateMin,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledDate ? (input.scheduledTime ?? null) : null,
    isMain: input.isMain ? 1 : 0,
    status: "planned",
    createdAt: now,
    plannedAt: input.scheduledDate ? now : null,
  });

  const titles = (input.subtaskTitles ?? []).filter(Boolean).slice(0, 12);
  if (titles.length > 0) {
    await db.insert(subtasks).values(
      titles.map((title, index) => ({
        id: crypto.randomUUID(),
        questId: id,
        title,
        done: 0,
        position: index,
        createdAt: now,
      })),
    );
  }

  const rows = await db.select().from(quests).where(eq(quests.id, id)).limit(1);
  return { ok: true, quest: rows[0] };
}

export async function updateQuest(
  userId: string,
  id: string,
  patch: Partial<{
    title: string;
    nextAction: string;
    domain: Domain;
    difficulty: number;
    importance: number;
    estimateMin: number;
    scheduledDate: string | null;
    isMain: boolean;
    notes: string | null;
  }>,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(quests)
    .set({
      ...patch,
      isMain: patch.isMain === undefined ? undefined : patch.isMain ? 1 : 0,
      plannedAt: patch.scheduledDate ? now : undefined,
      scheduledTime: patch.scheduledDate === null ? null : undefined,
      snoozeUntil: patch.scheduledDate === undefined ? undefined : null,
    })
    .where(and(eq(quests.id, id), eq(quests.userId, userId)));
}

export async function scheduleQuest(userId: string, id: string, date: string): Promise<void> {
  const counts = await countForDate(userId, date);
  if (counts.total >= 4) return;
  await updateQuest(userId, id, { scheduledDate: date });
}

export async function unscheduleQuest(userId: string, id: string): Promise<void> {
  await db
    .update(quests)
    .set({ scheduledDate: null, scheduledTime: null, snoozeUntil: null })
    .where(and(eq(quests.id, id), eq(quests.userId, userId)));
}

export async function snoozeAlarm(
  userId: string,
  id: string,
  minutes: number,
): Promise<{ ok: boolean; snoozeUntil?: string }> {
  const rows = await db
    .select({ id: quests.id, status: quests.status, scheduledTime: quests.scheduledTime })
    .from(quests)
    .where(and(eq(quests.id, id), eq(quests.userId, userId)))
    .limit(1);

  const quest = rows[0];
  if (!quest || quest.status === "done" || !quest.scheduledTime) return { ok: false };

  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  await db
    .update(quests)
    .set({ snoozeUntil: until })
    .where(and(eq(quests.id, id), eq(quests.userId, userId)));

  return { ok: true, snoozeUntil: until };
}

export async function deleteQuest(userId: string, id: string): Promise<void> {
  await db.delete(quests).where(and(eq(quests.id, id), eq(quests.userId, userId)));
}

export async function startQuest(userId: string, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(quests)
    .set({ status: "active", startedAt: sql`coalesce(${quests.startedAt}, ${now})` })
    .where(and(eq(quests.id, id), eq(quests.userId, userId), eq(quests.status, "planned")));
}

export async function deferQuest(
  userId: string,
  id: string,
): Promise<{ ok: boolean; becameBoss: boolean }> {
  const player = await getPlayer(userId);
  const today = todayInZone(player.timezone);

  const rows = await db
    .select()
    .from(quests)
    .where(and(eq(quests.id, id), eq(quests.userId, userId)))
    .limit(1);

  const quest = rows[0];
  if (!quest || quest.status === "done") return { ok: false, becameBoss: false };

  const deferredCount = quest.deferredCount + 1;
  const becomesBoss = deferredCount >= 3 && quest.bossMaxHp === 0;
  const maxHp = becomesBoss ? bossHpFor(quest.difficulty, quest.importance) : quest.bossMaxHp;

  await db
    .update(quests)
    .set({
      deferredCount,
      scheduledDate: addDays(today, 1),
      status: "planned",
      bossMaxHp: maxHp,
      bossHp: becomesBoss ? maxHp : quest.bossHp,
      isMain: 0,
      snoozeUntil: null,
    })
    .where(and(eq(quests.id, id), eq(quests.userId, userId)));

  return { ok: true, becameBoss: becomesBoss };
}

export async function completeQuest(input: {
  userId: string;
  questId: string;
  actualMin?: number | null;
}): Promise<
  | { ok: true; xp: number; streak: number; quest: QuestRow }
  | { ok: false; error: string }
> {
  const player = await getPlayer(input.userId);
  const today = todayInZone(player.timezone);

  return db.transaction((tx) => {
    const quest = tx
      .select()
      .from(quests)
      .where(and(eq(quests.id, input.questId), eq(quests.userId, input.userId)))
      .get();

    if (!quest) return { ok: false as const, error: "Deze quest bestaat niet." };
    if (quest.status === "done") return { ok: false as const, error: "Deze quest is al af." };

    const now = new Date().toISOString();
    const actualMin = input.actualMin ?? quest.actualMin ?? quest.estimateMin;
    const plannedDate = quest.plannedAt?.slice(0, 10) ?? null;
    const plannedAhead = plannedDate ? daysBetween(plannedDate, today) >= 0 && plannedDate < today : false;

    const xp = calculateQuestXp({
      difficulty: quest.difficulty,
      importance: quest.importance,
      isMain: quest.isMain === 1,
      plannedAhead,
      estimateMin: quest.estimateMin,
      actualMin,
    });

    tx.update(quests)
      .set({
        status: "done",
        completedAt: now,
        actualMin,
        xpAwarded: xp,
        bossHp: 0,
        snoozeUntil: null,
      })
      .where(eq(quests.id, quest.id))
      .run();

    tx.insert(xpEvents)
      .values({
        id: crypto.randomUUID(),
        userId: input.userId,
        questId: quest.id,
        domain: quest.domain,
        amount: xp,
        reason: quest.isMain === 1 ? "hoofdquest" : "quest",
        createdAt: now,
      })
      .run();

    tx.insert(activityDays)
      .values({
        id: crypto.randomUUID(),
        userId: input.userId,
        date: today,
        questsCompleted: 1,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [activityDays.userId, activityDays.date],
        set: { questsCompleted: sql`${activityDays.questsCompleted} + 1` },
      })
      .run();

    const gap = player.lastActiveDate ? daysBetween(player.lastActiveDate, today) : 0;
    const streak = advanceStreak({
      lastDate: player.lastActiveDate,
      today,
      current: player.streakCount,
      longest: player.longestStreak,
      graceUsed: player.graceUsed,
      graceMonth: player.graceMonth,
      gap,
    });

    const coins = player.coins + xp;
    const totalXp = player.totalXp + xp;
    const campLevel = Math.max(player.campLevel, 1 + Math.floor(Math.sqrt(totalXp / 120)));

    tx.update(players)
      .set({
        streakCount: streak.streak,
        longestStreak: streak.longest,
        lastActiveDate: today,
        graceUsed: streak.graceUsed,
        graceMonth: streak.graceMonth,
        coins,
        campLevel,
        totalXp,
      })
      .where(eq(players.userId, input.userId))
      .run();

    const updated = tx.select().from(quests).where(eq(quests.id, quest.id)).get();

    return { ok: true as const, xp, streak: streak.streak, quest: updated ?? quest };
  });
}

export async function uncompleteQuest(userId: string, questId: string): Promise<void> {
  const player = await getPlayer(userId);
  const today = todayInZone(player.timezone);

  db.transaction((tx) => {
    const quest = tx
      .select()
      .from(quests)
      .where(and(eq(quests.id, questId), eq(quests.userId, userId)))
      .get();

    if (!quest || quest.status !== "done") return;

    tx.delete(xpEvents).where(and(eq(xpEvents.questId, questId), eq(xpEvents.userId, userId))).run();

    tx.update(quests)
      .set({
        status: "planned",
        completedAt: null,
        xpAwarded: 0,
        actualMin: null,
        snoozeUntil: null,
      })
      .where(eq(quests.id, questId))
      .run();

    const day = tx
      .select()
      .from(activityDays)
      .where(and(eq(activityDays.userId, userId), eq(activityDays.date, today)))
      .get();

    if (day && day.questsCompleted > 1) {
      tx.update(activityDays)
        .set({ questsCompleted: day.questsCompleted - 1 })
        .where(eq(activityDays.id, day.id))
        .run();
    } else if (day) {
      tx.delete(activityDays).where(eq(activityDays.id, day.id)).run();
    }

    tx.update(players)
      .set({
        coins: sql`max(0, ${players.coins} - ${quest.xpAwarded})`,
        totalXp: sql`max(0, ${players.totalXp} - ${quest.xpAwarded})`,
      })
      .where(eq(players.userId, userId))
      .run();
  });
}

export async function addFocusSession(input: {
  userId: string;
  questId: string;
  minutes: number;
}): Promise<{ damage: number; bossHp: number }> {
  const quest = await getQuest(input.userId, input.questId);
  if (!quest) return { damage: 0, bossHp: 0 };

  const now = new Date();
  const damage = Math.min(quest.bossHp, input.minutes);

  await db.insert(focusSessions).values({
    id: crypto.randomUUID(),
    questId: input.questId,
    userId: input.userId,
    minutes: input.minutes,
    damage,
    startedAt: new Date(now.getTime() - input.minutes * 60_000).toISOString(),
    endedAt: now.toISOString(),
  });

  if (quest.bossHp > 0) {
    await db
      .update(quests)
      .set({
        bossHp: sql`max(0, ${quests.bossHp} - ${damage})`,
        startedAt: sql`coalesce(${quests.startedAt}, ${now.toISOString()})`,
      })
      .where(and(eq(quests.id, input.questId), eq(quests.userId, input.userId)));
  }

  return { damage, bossHp: Math.max(0, quest.bossHp - damage) };
}

export async function addSubtask(userId: string, questId: string, title: string): Promise<void> {
  const quest = await getQuest(userId, questId);
  if (!quest) return;

  await db.insert(subtasks).values({
    id: crypto.randomUUID(),
    questId,
    title,
    done: 0,
    position: quest.subtasks.length,
    createdAt: new Date().toISOString(),
  });
}

export async function toggleSubtask(userId: string, subtaskId: string, done: boolean): Promise<void> {
  const rows = await db
    .select({ questId: subtasks.questId })
    .from(subtasks)
    .innerJoin(quests, eq(quests.id, subtasks.questId))
    .where(and(eq(subtasks.id, subtaskId), eq(quests.userId, userId)))
    .limit(1);

  if (!rows[0]) return;
  await db.update(subtasks).set({ done: done ? 1 : 0 }).where(eq(subtasks.id, subtaskId));
}

export async function getUpcoming(userId: string, today: string): Promise<QuestWithSubtasks[]> {
  const rows = await db
    .select()
    .from(quests)
    .where(
      and(
        eq(quests.userId, userId),
        sql`${quests.scheduledDate} > ${today}`,
        ne(quests.status, "done"),
      ),
    )
    .orderBy(asc(quests.scheduledDate))
    .limit(20);

  return withSubtasks(rows);
}
