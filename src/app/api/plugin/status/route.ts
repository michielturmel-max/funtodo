import { NextResponse } from "next/server";
import { getPluginUser } from "@/server/auth/plugin";
import { DOMAINS } from "@/lib/game";
import { alarmInfo, type AlarmInfo } from "@/lib/alarm";
import { todayInZone } from "@/lib/dates";
import { countForDate, getInbox, getTodayQuests, moveOverdueToInbox } from "@/server/repositories/quests";
import { getPlayer, getStats, getWeekSummary } from "@/server/repositories/player";

type AlarmPayload = AlarmInfo & {
  id: string;
  title: string;
  baseTime: string;
  scheduledTime: string;
};

export async function GET(request: Request) {
  const user = await getPluginUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const player = await getPlayer(user.id);
  const today = todayInZone(player.timezone);

  await moveOverdueToInbox(user.id, today);

  const [quests, stats, week, inbox, counts] = await Promise.all([
    getTodayQuests(user.id, today),
    getStats(user.id),
    getWeekSummary(user.id),
    getInbox(user.id),
    countForDate(user.id, today),
  ]);

  const alarms: AlarmPayload[] = [];
  for (const quest of quests) {
    if (quest.status === "done" || !quest.scheduledTime) continue;
    const info = alarmInfo({
      date: quest.scheduledDate,
      time: quest.scheduledTime,
      snoozeUntil: quest.snoozeUntil,
      timezone: player.timezone,
    });
    if (!info) continue;
    alarms.push({
      id: quest.id,
      title: quest.title,
      baseTime: quest.scheduledTime,
      scheduledTime: quest.scheduledTime,
      ...info,
    });
  }

  const nextAlarm =
    alarms
      .filter((alarm) => alarm.state !== "missed")
      .sort((a, b) => {
        if (a.state !== b.state) return a.state === "ringing" ? -1 : 1;
        return a.minutesUntil - b.minutesUntil;
      })[0] ?? null;

  return NextResponse.json({
    ok: true,
    player: {
      username: user.username,
      name: player.displayName,
      coins: stats.coins,
      streak: stats.streak,
      longest: stats.longest,
      level: stats.level,
      totalXp: stats.totalXp,
    },
    today,
    quests: quests.map((quest) => ({
      id: quest.id,
      title: quest.title,
      nextAction: quest.nextAction,
      domain: quest.domain,
      domainLabel:
        DOMAINS[quest.domain as keyof typeof DOMAINS]?.label ?? quest.domain,
      estimateMin: quest.estimateMin,
      isMain: quest.isMain === 1,
      status: quest.status,
      scheduledTime: quest.scheduledTime,
      snoozeUntil: quest.snoozeUntil,
      bossHp: quest.bossHp,
      bossMaxHp: quest.bossMaxHp,
      deferredCount: quest.deferredCount,
    })),
    alarms,
    nextAlarm,
    counts,
    inboxCount: inbox.length,
    week: {
      completed: week.completed,
      minutes: week.minutes,
      plannedMain: week.plannedMain,
    },
  });
}
