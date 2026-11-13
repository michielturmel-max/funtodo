import { DOMAINS, type Domain } from "@/lib/game";
import { cn } from "@/lib/utils";
import type { QuestWithSubtasks } from "@/server/repositories/quests";
import { ClockIcon, SwordsIcon } from "./icons";
import { QuestActions } from "./quest-actions";
import { QuestTimer } from "./quest-timer";
import { SubtaskList } from "./subtask-list";

function forecastXp(quest: QuestWithSubtasks): number {
  const base = quest.difficulty * quest.importance * 10;
  return Math.round(base * (quest.isMain === 1 ? 1.2 : 1));
}

export function QuestCard({
  quest,
  today,
  variant = "side",
}: {
  quest: QuestWithSubtasks;
  today: string;
  variant?: "main" | "side";
}) {
  const domain = DOMAINS[quest.domain as Domain] ?? DOMAINS.craft;
  const isMain = variant === "main";
  const done = quest.status === "done";
  const boss = quest.bossHp > 0;
  const bossPercent = quest.bossMaxHp > 0 ? Math.round((quest.bossHp / quest.bossMaxHp) * 100) : 0;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-colors",
        isMain
          ? "border-ink bg-ink px-5 py-5 text-chalk shadow-[0_18px_40px_-28px_rgba(22,36,29,0.8)] sm:px-6 sm:py-6"
          : "border-line bg-chalk px-4 py-4",
        done && "opacity-60",
      )}
    >
      {isMain && (
        <svg
          viewBox="0 0 200 200"
          className="pointer-events-none absolute -right-16 -top-16 size-52 text-chalk/10"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="48" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <path d="M100 20v160M20 100h160" stroke="currentColor" strokeWidth="0.6" />
        </svg>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                isMain ? "border-chalk/25 text-chalk/80" : "border-line text-ink-soft",
              )}
            >
              <span className="size-2 rounded-full" style={{ background: domain.color }} />
              {domain.label}
            </span>
            {quest.scheduledTime && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  isMain ? "border-chalk/25 text-chalk/80" : "border-line text-ink-soft",
                )}
              >
                <ClockIcon className="size-3" />
                {quest.scheduledTime}
              </span>
            )}
            {quest.isMain === 1 && (
              <span className="rounded-full bg-ember px-2.5 py-1 text-[11px] font-semibold text-chalk">
                Hoofdquest
              </span>
            )}
            {boss && (
              <span className="inline-flex items-center gap-1 rounded-full border border-ember/40 px-2.5 py-1 text-[11px] font-semibold text-ember">
                <SwordsIcon className="size-3" />
                Baas
              </span>
            )}
            {done && <span className="text-[11px] font-semibold text-moss-deep">Afgerond</span>}
          </div>

          <h3
            className={cn(
              "text-balance font-display font-semibold leading-tight",
              isMain ? "text-2xl sm:text-3xl" : "text-lg",
              done && "line-through decoration-1",
            )}
          >
            {quest.title}
          </h3>

          <p className={cn("mt-1.5 text-sm", isMain ? "text-chalk/70" : "text-ink-soft")}>
            <span className={cn("font-semibold", isMain ? "text-chalk/90" : "text-ink")}>Eerste stap: </span>
            {quest.nextAction}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className={cn("inline-flex items-center gap-1.5", isMain ? "text-chalk/70" : "text-ink-soft")}>
              <ClockIcon className="size-3.5" />± {quest.estimateMin} min
            </span>
            <span className={isMain ? "text-chalk/70" : "text-ink-soft"}>
              {quest.difficulty === 1 ? "Klein" : quest.difficulty === 2 ? "Stevig" : "Zwaar"}
            </span>
            {!done && (
              <span className={cn("font-semibold", isMain ? "text-gold" : "text-ember")}>
                ~{forecastXp(quest)} XP
              </span>
            )}
          </div>
        </div>

        <QuestActions
          questId={quest.id}
          status={quest.status}
          isMain={isMain}
          bossHp={quest.bossHp}
          scheduledDate={quest.scheduledDate}
          today={today}
        />
      </div>

      {!done && <QuestTimer questId={quest.id} tone={isMain ? "dark" : "light"} />}

      {boss && !done && (
        <div className="relative mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
            <span className={isMain ? "text-chalk/70" : "text-ink-soft"}>
              Baas · {quest.bossHp}/{quest.bossMaxHp} HP
            </span>
            <span className={isMain ? "text-chalk/50" : "text-ink-soft"}>{bossPercent}%</span>
          </div>
          <div className={cn("h-2 overflow-hidden rounded-full", isMain ? "bg-chalk/15" : "bg-line-soft")}>
            <div
              className="h-full rounded-full bg-ember transition-[width] duration-500"
              style={{ width: `${bossPercent}%` }}
            />
          </div>
        </div>
      )}

      {!done && quest.subtasks.length > 0 && (
        <div>
          <SubtaskList
            tone={isMain ? "dark" : "light"}
            subtasks={quest.subtasks.map((item) => ({
              id: item.id,
              title: item.title,
              done: item.done,
            }))}
          />
        </div>
      )}
    </article>
  );
}
