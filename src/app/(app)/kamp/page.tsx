import type { Metadata } from "next";
import Link from "next/link";
import { addDays, formatShortDate, todayInZone } from "@/lib/dates";
import { parseCampItems } from "@/lib/camp";
import { streakLabel } from "@/lib/game";
import { requireUser } from "@/server/auth/session";
import { getBosses, getRecentDone } from "@/server/repositories/quests";
import { getPlayer, getRecentActivity, getStats, getWeekSummary } from "@/server/repositories/player";
import { CampScene } from "@/components/camp-scene";
import { CampUpgrades } from "@/components/camp-upgrades";
import { ChevronRightIcon, FlameIcon, SwordsIcon } from "@/components/icons";
import { QuestCard } from "@/components/quest-card";
import { StatBars } from "@/components/stat-bars";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Kamp" };

export default async function CampPage() {
  const user = await requireUser();
  const player = await getPlayer(user.id);
  const today = todayInZone(player.timezone);

  const [stats, activity, recent, bosses, week] = await Promise.all([
    getStats(user.id),
    getRecentActivity(user.id, 14),
    getRecentDone(user.id, 6),
    getBosses(user.id),
    getWeekSummary(user.id),
  ]);

  const activityMap = new Map(activity.map((day) => [day.date, day.questsCompleted]));
  const days = Array.from({ length: 14 }, (_, index) => addDays(today, index - 13));
  const activeDays = days.filter((day) => (activityMap.get(day) ?? 0) > 0).length;
  const campItems = parseCampItems(player.campItems);

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Je basiskamp</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Kamp</h1>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">
          Je kamp groeit met wat je afmaakt. Niet met hoe vaak je de app opent.
        </p>
      </header>

      <section className="panel overflow-hidden">
        <CampScene level={player.campLevel} items={campItems} className="h-auto w-full" />
        <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-3 sm:p-5">
          <div>
            <p className="text-xs font-semibold text-ink-soft">Kampniveau</p>
            <p className="mt-1 font-display text-3xl font-semibold">{player.campLevel}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-soft">Munten</p>
            <p className="mt-1 font-display text-3xl font-semibold">{player.coins}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-soft">Deze week</p>
            <p className="mt-1 font-display text-3xl font-semibold">{week.completed}</p>
            <p className="text-xs text-ink-soft">quests afgerond</p>
          </div>
        </div>
      </section>

      <Link
        href="/kamp/samen"
        className="panel flex items-center gap-4 px-5 py-4 transition-colors hover:bg-chalk"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ember/10 text-ember">
          <SwordsIcon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Samen op expeditie</span>
          <span className="block text-xs text-ink-soft">
            Klim met iedereen naar de top en versla de yeti met focus-minuten.
          </span>
        </span>
        <ChevronRightIcon className="size-5 shrink-0 text-ink-soft" />
      </Link>

      <CampUpgrades initialCoins={player.coins} initialItems={campItems} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl">Vaardigheden</h2>
            <span className="text-xs text-ink-soft">{stats.totalXp} XP totaal</span>
          </div>
          <StatBars byDomain={stats.byDomain} />
        </section>

        <section className="panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl">Kampvuur</h2>
              <p className="mt-1 text-sm text-ink-soft">{streakLabel(stats.streak)}</p>
            </div>
            <span className="animate-flame grid size-14 place-items-center rounded-full bg-ember/10 text-ember">
              <FlameIcon className="size-8" />
            </span>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <span className="font-display text-5xl font-semibold leading-none">{stats.streak}</span>
            <span className="pb-1 text-sm text-ink-soft">{stats.streak === 1 ? "dag" : "dagen"} op rij</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-paper/70 px-3 py-2.5">
              <p className="text-xs text-ink-soft">Langste reeks</p>
              <p className="font-semibold">
                {stats.longest} {stats.longest === 1 ? "dag" : "dagen"}
              </p>
            </div>
            <div className="rounded-xl bg-paper/70 px-3 py-2.5">
              <p className="text-xs text-ink-soft">Rustdag deze maand</p>
              <p className="font-semibold">{stats.graceUsed >= 1 ? "gebruikt" : "nog beschikbaar"}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-ink-soft">
              <span>Laatste 14 dagen</span>
              <span>{activeDays} actief</span>
            </div>
            <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
              {days.map((day) => {
                const count = activityMap.get(day) ?? 0;
                return (
                  <span
                    key={day}
                    title={`${day}: ${count} quests`}
                    className={cn(
                      "aspect-square rounded-[4px] border",
                      count > 2
                        ? "border-moss-deep bg-moss-deep"
                        : count > 0
                          ? "border-moss bg-moss"
                          : "border-line bg-white/40",
                    )}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {bosses.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="flex items-center gap-2 text-xl">
            <SwordsIcon className="size-5 text-ember" />
            Bazen in je kamp
          </h2>
          <div className="space-y-2.5">
            {bosses.map((quest) => (
              <QuestCard key={quest.id} quest={quest} today={today} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2.5">
        <h2 className="text-xl">Laatste overwinningen</h2>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-soft">
            Nog niets afgerond. Je eerste stop wacht op de kaart.
          </p>
        ) : (
          <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-chalk">
            {recent.map((quest) => (
              <li key={quest.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="size-2 shrink-0 rounded-full bg-moss" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{quest.title}</p>
                  <p className="text-xs text-ink-soft">
                    {quest.completedAt ? formatShortDate(quest.completedAt.slice(0, 10)) : ""} ·{" "}
                    {quest.actualMin ?? quest.estimateMin} min
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-ember">+{quest.xpAwarded} XP</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
