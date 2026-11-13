import type { Metadata } from "next";
import Link from "next/link";
import { formatDay, todayInZone } from "@/lib/dates";
import { requireUser } from "@/server/auth/session";
import { getPlayer } from "@/server/repositories/player";
import { getTodayQuests } from "@/server/repositories/quests";
import { QuestForm } from "@/components/quest-form";
import { ChevronRightIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Nieuwe quest" };

export default async function NewQuestPage() {
  const user = await requireUser();
  const player = await getPlayer(user.id);
  const today = todayInZone(player.timezone);
  const quests = await getTodayQuests(user.id, today);
  const hasMain = quests.some((quest) => quest.isMain === 1 && quest.status !== "done");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/vandaag" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
          <ChevronRightIcon className="size-3.5 rotate-180" />
          Terug naar vandaag
        </Link>
        <h1 className="mt-2 text-4xl sm:text-5xl">Nieuwe quest</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Eén stop voor {formatDay(today, player.timezone)}. Maak hem klein genoeg om nu te beginnen.
        </p>
      </div>

      <QuestForm today={today} hasMain={hasMain} />
    </div>
  );
}
