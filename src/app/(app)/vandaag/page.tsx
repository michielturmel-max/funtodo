import type { Metadata } from "next";
import { formatDay, todayInZone } from "@/lib/dates";
import { streakLabel } from "@/lib/game";
import { requireUser } from "@/server/auth/session";
import { getBosses, getInbox, getTodayQuests, moveOverdueToInbox } from "@/server/repositories/quests";
import { getPlayer, getStats } from "@/server/repositories/player";
import { QuestCard } from "@/components/quest-card";
import { TrailProgress } from "@/components/stat-bars";
import { ChevronRightIcon, FlameIcon, PlusIcon, SwordsIcon } from "@/components/icons";
import Link from "next/link";

export const metadata: Metadata = { title: "Vandaag" };

function greeting(timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: timezone }).format(new Date()),
  );
  if (hour < 6) return "Nog wakker";
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export default async function TodayPage() {
  const user = await requireUser();
  const player = await getPlayer(user.id);
  const today = todayInZone(player.timezone);

  await moveOverdueToInbox(user.id, today);

  const [quests, stats, bosses, inbox] = await Promise.all([
    getTodayQuests(user.id, today),
    getStats(user.id),
    getBosses(user.id),
    getInbox(user.id),
  ]);

  const main = quests.find((quest) => quest.isMain === 1);
  const sides = quests
    .filter((quest) => quest.isMain !== 1)
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));
  const done = quests.filter((quest) => quest.status === "done").length;
  const firstName = player.displayName.split(" ")[0];

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-soft first-letter:uppercase">
            {formatDay(today, player.timezone)}
          </p>
          <h1 className="mt-1 text-4xl leading-none sm:text-5xl">
            {greeting(player.timezone)}, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {quests.length === 0
              ? "De kaart is nog leeg. Kies je eerste stop."
              : done === quests.length
                ? "Alle stops gedaan. Het vuur brandt."
                : "Eén stop tegelijk. De rest kan wachten."}
          </p>
        </div>
        <div className="hidden sm:block">
          <Link href="/quests/nieuw" className="btn btn-ember"><PlusIcon className="size-4" />Nieuwe quest</Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <TrailProgress total={quests.length} done={done} />
        <div className="flex items-center gap-2 sm:justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-chalk px-3 py-2 text-xs font-semibold">
            <FlameIcon className="size-4 text-ember" />
            {stats.streak} {stats.streak === 1 ? "dag" : "dagen"} · {streakLabel(stats.streak)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-chalk px-3 py-2 text-xs font-semibold sm:hidden">
            <span className="size-2 rounded-full bg-gold" />
            {stats.coins}
          </span>
        </div>
      </div>

      <div className="sm:hidden">
        <Link href="/quests/nieuw" className="btn btn-ember"><PlusIcon className="size-4" />Nieuwe quest</Link>
      </div>

      {quests.length === 0 ? (
        <section className="panel relative overflow-hidden p-6 sm:p-8">
          <div className="max-w-md">
            <p className="eyebrow">Lege kaart</p>
            <h2 className="mt-2 text-3xl">Begin met één stop.</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Niet je hele leven. Niet je hele lijst. Eén quest die vandaag het verschil maakt, met een eerste
              stap die je nu kunt zetten.
            </p>
          </div>
          <svg
            viewBox="0 0 200 200"
            className="pointer-events-none absolute -bottom-16 -right-12 size-56 text-line"
            aria-hidden="true"
          >
            <path d="M10 170c40-50 60-60 90-40s60 10 90-40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 9" />
            <circle cx="100" cy="130" r="6" fill="var(--color-ember)" />
          </svg>
        </section>
      ) : (
        <>
          {main && <QuestCard quest={main} today={today} variant="main" />}

          {sides.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl">Zijpaden</h2>
                <span className="text-xs text-ink-soft">
                  {sides.filter((quest) => quest.status === "done").length}/{sides.length} gedaan
                </span>
              </div>
              <div className="space-y-2.5">
                {sides.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} today={today} />
                ))}
              </div>
            </section>
          )}

          {!main && (
            <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-soft">
              Vandaag heeft nog geen hoofdquest. Kies de stop die het meest telt.
            </p>
          )}
        </>
      )}

      {bosses.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl">
              <SwordsIcon className="size-5 text-ember" />
              Bazen
            </h2>
            <Link href="/quests" className="inline-flex items-center text-xs font-semibold text-ink-soft">
              Alles bekijken <ChevronRightIcon className="size-3.5" />
            </Link>
          </div>
          <p className="text-sm text-ink-soft">
            Taken die je drie keer hebt uitgesteld. Verdeel ze in stappen en hak ze stuk.
          </p>
          <div className="space-y-2.5">
            {bosses.slice(0, 3).map((quest) => (
              <QuestCard key={quest.id} quest={quest} today={today} />
            ))}
          </div>
        </section>
      )}

      {inbox.length > 0 && (
        <Link
          href="/quests"
          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-chalk/60 px-4 py-3.5 transition-colors hover:bg-chalk"
        >
          <div>
            <p className="text-sm font-semibold">
              {inbox.length} {inbox.length === 1 ? "quest wacht" : "quests wachten"} in je inbox
            </p>
            <p className="text-xs text-ink-soft">Nog niet op de kaart. Plan ze of laat ze liggen.</p>
          </div>
          <ChevronRightIcon className="size-5 shrink-0 text-ink-soft" />
        </Link>
      )}
    </div>
  );
}
