import type { Metadata } from "next";
import Link from "next/link";
import { parseAvatar } from "@/lib/avatar";
import { formatShortDate, todayInZone } from "@/lib/dates";
import { DOMAINS, type Domain } from "@/lib/game";
import { requireUser } from "@/server/auth/session";
import { getPlayer } from "@/server/repositories/player";
import {
  CLIMB_MIN,
  WEEK_GOAL_MIN,
  YETI_MIN,
  getExpedition,
} from "@/server/repositories/expedition";
import { Avatar } from "@/components/avatar";
import { ExpeditionScene } from "@/components/expedition-scene";
import { ShareToggle } from "@/components/share-toggle";
import { ChevronRightIcon, SwordsIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Samen op expeditie" };

export default async function ExpeditionPage() {
  const user = await requireUser();
  const player = await getPlayer(user.id);
  const today = todayInZone(player.timezone);
  const expedition = await getExpedition(player.timezone);

  const total = expedition.totalMinutes;
  const climbMinutes = Math.min(total, CLIMB_MIN);
  const yetiMinutes = Math.max(0, total - CLIMB_MIN);
  const yetiHp = Math.max(0, YETI_MIN - yetiMinutes);
  const defeated = total >= WEEK_GOAL_MIN;
  const progress = Math.min(1, total / WEEK_GOAL_MIN);
  const maxMinutes = Math.max(CLIMB_MIN, ...expedition.members.map((member) => member.minutes), 1);

  return (
    <div className="space-y-5">
      <header>
        <Link href="/kamp" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
          <ChevronRightIcon className="size-3.5 rotate-180" />
          Kamp
        </Link>
        <h1 className="mt-2 text-4xl sm:text-5xl">Samen op expeditie</h1>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">
          Iedereen klimt mee. Focus-minuten van de hele groep tellen, tot jullie de top halen en de yeti
          verslaan.
        </p>
      </header>

      <section className="panel overflow-hidden">
        <ExpeditionScene progress={progress} defeated={defeated} className="h-auto w-full" />

        <div className="space-y-4 border-t border-line p-4 sm:p-5">
          <div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">De klim</span>
              <span className="text-ink-soft">
                {Math.min(climbMinutes, CLIMB_MIN)} / {CLIMB_MIN} min
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line-soft">
              <div
                className="h-full rounded-full bg-moss transition-all"
                style={{ width: `${Math.min(100, (climbMinutes / CLIMB_MIN) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 font-semibold">
                <SwordsIcon className="size-4 text-ember" />
                {defeated ? "Yeti verslagen" : "Yeti op de top"}
              </span>
              <span className="text-ink-soft">
                {defeated ? "Deze week gelukt" : `${yetiHp} / ${YETI_MIN} HP`}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line-soft">
              <div
                className="h-full rounded-full bg-ember transition-all"
                style={{ width: `${Math.max(0, (yetiHp / YETI_MIN) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-ink-soft">
              {defeated
                ? "Knap werk. Volgende week staat er weer een nieuwe yeti."
                : `Nog ${Math.max(0, YETI_MIN - yetiMinutes)} focus-minuten tot de yeti valt.`}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-line-soft pt-3 text-center">
            <div>
              <p className="font-display text-2xl font-semibold">{total}</p>
              <p className="text-[11px] text-ink-soft">focus-minuten</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{expedition.questsDone}</p>
              <p className="text-[11px] text-ink-soft">quests afgerond</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{expedition.members.length}</p>
              <p className="text-[11px] text-ink-soft">reizigers</p>
            </div>
          </div>
        </div>
      </section>

      <ShareToggle initial={player.shareActivity === 1} />

      {expedition.privateCount > 0 && (
        <p className="text-xs text-ink-soft">
          {expedition.privateCount}{" "}
          {expedition.privateCount === 1 ? "reiziger deelt" : "reizigers delen"} alleen voor zichzelf.
        </p>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl">Deze week</h2>
          <span className="text-xs text-ink-soft">sinds {formatShortDate(expedition.weekStart)}</span>
        </div>

        {expedition.members.length === 0 ? (
          <p className="panel p-5 text-sm text-ink-soft">
            Nog niemand deelt deze week. Zet je eigen expeditie aan en nodig de rest uit.
          </p>
        ) : (
          <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-chalk">
            {expedition.members.map((member) => (
              <li key={member.userId} className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar config={parseAvatar(member.avatar)} className="size-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {member.displayName}
                        {member.userId === user.id && (
                          <span className="ml-1 text-[11px] font-medium text-ink-soft">(jij)</span>
                        )}
                      </p>
                      <p className="shrink-0 text-xs font-semibold">{member.minutes} min</p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
                      <div
                        className="h-full rounded-full bg-moss"
                        style={{ width: `${Math.min(100, (member.minutes / maxMinutes) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-soft">
                      level {member.level} · {member.questsDone}{" "}
                      {member.questsDone === 1 ? "quest" : "quests"} · {member.streak}{" "}
                      {member.streak === 1 ? "dag" : "dagen"} vuur
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl">Laatste kampverhalen</h2>
        {expedition.activities.length === 0 ? (
          <p className="panel p-5 text-sm text-ink-soft">
            Nog geen afgeronde quests deze week. De eerste vonk moet nog komen.
          </p>
        ) : (
          <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-chalk">
            {expedition.activities.map((activity) => {
              const domain = DOMAINS[activity.domain as Domain] ?? DOMAINS.craft;
              return (
                <li key={activity.id} className="flex items-start gap-3 px-4 py-3">
                  <Avatar config={parseAvatar(activity.avatar)} className="size-8 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.displayName}</span> rondde{" "}
                      <span className="font-semibold">{activity.title}</span> af
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
                      <span className="inline-flex items-center gap-1">
                        <span className="size-1.5 rounded-full" style={{ background: domain.color }} />
                        {domain.label}
                      </span>
                      {activity.actualMin ? <span>{activity.actualMin} min</span> : null}
                      {activity.completedAt ? (
                        <span>{formatShortDate(activity.completedAt.slice(0, 10))}</span>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-ink-soft">
        Alleen focus-minuten en afgeronde quests van deelnemers die delen tellen mee. Vandaag is{" "}
        {formatShortDate(today)}.
      </p>
    </div>
  );
}
