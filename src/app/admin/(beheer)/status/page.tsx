import type { Metadata } from "next";
import { formatShortDate } from "@/lib/dates";
import { parseAvatar } from "@/lib/avatar";
import { requireAdminSession } from "@/server/auth/session";
import { WEEK_GOAL_MIN, getAdminOverview } from "@/server/repositories/expedition";
import { Avatar } from "@/components/avatar";

export const metadata: Metadata = { title: "Beheer · status" };

export default async function AdminStatusPage() {
  const admin = await requireAdminSession();
  const overview = await getAdminOverview();
  const maxMinutes = Math.max(60, ...overview.members.map((member) => member.minutes));
  const maxQuests = Math.max(4, ...overview.members.map((member) => member.questsDone));
  const maxDaily = Math.max(30, ...overview.daily.map((day) => day.minutes));
  const shared = overview.members.filter((member) => member.shareActivity).length;
  const total = overview.totalMinutes;

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Beheerder</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Status van het kamp</h1>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">
          Voortgang sinds {formatShortDate(overview.weekStart)}, inclusief reizigers die hun expeditie
          privé houden.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Reizigers", value: overview.members.length, note: shared === 1 ? "1 deelt mee" : `${shared} delen mee` },
          { label: "Focus-minuten", value: total, note: `doel ${WEEK_GOAL_MIN} min` },
          { label: "Quests afgerond", value: overview.questsDone, note: "deze week" },
          {
            label: "Gemiddeld",
            value: overview.members.length > 0 ? Math.round(total / overview.members.length) : 0,
            note: "min per reiziger",
          },
        ].map((card) => (
          <div key={card.label} className="panel px-4 py-3">
            <p className="text-xs font-semibold text-ink-soft">{card.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{card.value}</p>
            <p className="text-[11px] text-ink-soft">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="panel p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl">Focus per dag</h2>
          <span className="text-xs text-ink-soft">laatste 14 dagen</span>
        </div>
        <div className="mt-4 flex h-32 items-end gap-1">
          {overview.daily.map((day) => (
            <div key={day.date} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t bg-moss transition-colors group-hover:bg-moss-deep"
                style={{ height: `${Math.max(4, (day.minutes / maxDaily) * 100)}px` }}
                title={`${formatShortDate(day.date)}: ${day.minutes} min`}
              />
              <span className="text-[9px] text-ink-soft">{day.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl">Per reiziger</h2>
          <span className="text-xs text-ink-soft">{formatShortDate(overview.weekStart)} t/m nu</span>
        </div>

        <ul className="space-y-3">
          {overview.members.map((member) => (
            <li key={member.userId} className="panel px-4 py-4">
              <div className="flex items-start gap-3">
                <Avatar config={parseAvatar(member.avatar)} className="size-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                      {member.displayName}
                      {member.userId === admin.id && (
                        <span className="ml-1 text-[11px] font-medium text-ink-soft">(jij)</span>
                      )}
                    </p>
                    <span className="text-xs text-ink-soft">@{member.username}</span>
                    {member.role === "admin" && (
                      <span className="rounded-full border border-gold/50 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                        beheerder
                      </span>
                    )}
                    {!member.shareActivity && (
                      <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                        deelt niet
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-ink-soft">
                        <span>Focus-minuten</span>
                        <span className="font-semibold text-ink">{member.minutes}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-soft">
                        <div
                          className="h-full rounded-full bg-moss"
                          style={{ width: `${Math.min(100, (member.minutes / maxMinutes) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-ink-soft">
                        <span>Quests afgerond</span>
                        <span className="font-semibold text-ink">{member.questsDone}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-soft">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${Math.min(100, (member.questsDone / maxQuests) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-soft">
                    <span>level {member.level}</span>
                    <span>{member.totalXp} XP</span>
                    <span>
                      {member.streak} {member.streak === 1 ? "dag" : "dagen"} vuur (langst {member.longest})
                    </span>
                    <span>
                      {member.lastActiveDate
                        ? `laatst actief ${formatShortDate(member.lastActiveDate)}`
                        : "nog niet actief"}
                    </span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
