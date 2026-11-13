import Link from "next/link";
import { parseAvatar } from "@/lib/avatar";
import { todayInZone } from "@/lib/dates";
import { getPlayer } from "@/server/repositories/player";
import { getTodayQuests } from "@/server/repositories/quests";
import { requireUser } from "@/server/auth/session";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNav } from "@/components/desktop-nav";
import { FlameIcon } from "@/components/icons";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { OfflineBanner } from "@/components/offline-banner";
import { PwaRegister } from "@/components/pwa-register";
import { QuestAlarm } from "@/components/quest-alarm";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const player = await getPlayer(user.id);
  const avatar = parseAvatar(player.avatar);
  const today = todayInZone(player.timezone);
  const quests = await getTodayQuests(user.id, today);
  const alarms = quests
    .filter((quest) => quest.status !== "done" && quest.scheduledTime)
    .map((quest) => ({
      id: quest.id,
      title: quest.title,
      time: quest.scheduledTime as string,
      snoozeUntil: quest.snoozeUntil,
    }));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4 px-4">
          <Logo href="/vandaag" />
          <div className="hidden flex-1 justify-center md:flex">
            <DesktopNav />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-chalk px-2.5 py-1.5 text-xs font-semibold">
              <FlameIcon className="size-3.5 text-ember" />
              {player.streakCount}
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-chalk px-2.5 py-1.5 text-xs font-semibold sm:inline-flex">
              <span className="size-2 rounded-full bg-gold" />
              {player.coins}
            </span>
            <Link
              href="/profiel"
              className="rounded-full"
              aria-label="Profiel"
            >
              <Avatar config={avatar} className="size-9" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-5 md:pb-16 md:pt-8">
        <OfflineBanner />
        {children}
      </main>

      <BottomNav />
      <PwaRegister />
      <QuestAlarm date={today} alarms={alarms} />
    </div>
  );
}
