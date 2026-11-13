import type { Metadata } from "next";
import Link from "next/link";
import { todayInZone } from "@/lib/dates";
import { requireUser } from "@/server/auth/session";
import { getAllQuests, moveOverdueToInbox } from "@/server/repositories/quests";
import { getPlayer } from "@/server/repositories/player";
import { QuestCard } from "@/components/quest-card";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Quests" };

export default async function QuestsPage() {
  const user = await requireUser();
  const player = await getPlayer(user.id);
  const today = todayInZone(player.timezone);
  await moveOverdueToInbox(user.id, today);
  const quests = await getAllQuests(user.id);

  const todayQuests = quests.filter((quest) => quest.scheduledDate === today && quest.status !== "done");
  const later = quests
    .filter((quest) => quest.scheduledDate && quest.scheduledDate > today && quest.status !== "done")
    .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""));
  const inbox = quests.filter((quest) => !quest.scheduledDate && quest.status !== "done");
  const done = quests.filter((quest) => quest.status === "done").slice(0, 12);
  const hasMain = todayQuests.some((quest) => quest.isMain === 1);

  const sections = [
    { title: "Vandaag", items: todayQuests, note: `${todayQuests.length} op de kaart` },
    { title: "Later", items: later, note: `${later.length} gepland` },
    { title: "Inbox", items: inbox, note: "Nog geen datum" },
  ].filter((section) => section.items.length > 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Je kaart</p>
          <h1 className="mt-1 text-4xl sm:text-5xl">Quests</h1>
          <p className="mt-2 max-w-lg text-sm text-ink-soft">
            Alles wat je hebt opgeschreven. Plan iets uit je inbox met één tik op vandaag.
          </p>
        </div>
        <Link href="/quests/nieuw" className="btn btn-ember"><PlusIcon className="size-4" />Nieuwe quest</Link>
      </header>

      {sections.length === 0 && (
        <section className="panel p-8 text-center">
          <h2 className="text-2xl">Nog niets op de kaart</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Voeg je eerste quest toe. Begin klein: iets wat je binnen een half uur kunt afronden.
          </p>
        </section>
      )}

      {sections.map((section) => (
        <section key={section.title} className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl">{section.title}</h2>
            <span className="text-xs text-ink-soft">{section.note}</span>
          </div>
          <div className="space-y-2.5">
            {section.items.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                today={today}
                variant={quest.isMain === 1 ? "main" : "side"}
              />
            ))}
          </div>
        </section>
      ))}

      {done.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl">Afgerond</h2>
            <span className="text-xs text-ink-soft">Laatste {done.length}</span>
          </div>
          <div className="space-y-2">
            {done.map((quest) => (
              <Link
                key={quest.id}
                href="/kamp"
                className="flex items-center gap-3 rounded-xl border border-line/70 bg-chalk/50 px-4 py-2.5 text-sm"
              >
                <span className="size-2 rounded-full bg-moss" />
                <span className="min-w-0 flex-1 truncate line-through decoration-1">{quest.title}</span>
                <span className="shrink-0 text-xs font-semibold text-ember">+{quest.xpAwarded} XP</span>
                <ChevronRightIcon className="size-4 shrink-0 text-ink-soft" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
