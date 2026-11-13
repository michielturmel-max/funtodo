import type { Metadata } from "next";
import Link from "next/link";
import { parseAvatar, parseOwnedItems } from "@/lib/avatar";
import { requireUser } from "@/server/auth/session";
import { getPlayer } from "@/server/repositories/player";
import { AvatarEditor } from "@/components/avatar-editor";
import { ChevronRightIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Avatar" };

export default async function AvatarPage() {
  const user = await requireUser();
  const player = await getPlayer(user.id);

  return (
    <div className="space-y-5">
      <header>
        <Link href="/profiel" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
          <ChevronRightIcon className="size-3.5 rotate-180" />
          Profiel
        </Link>
        <h1 className="mt-2 text-4xl sm:text-5xl">Jouw reiziger</h1>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">
          Stel jezelf samen zoals je wilt. Alles wat je vrij speelt, blijft van jou.
        </p>
      </header>

      <AvatarEditor
        displayName={player.displayName}
        initialConfig={parseAvatar(player.avatar)}
        initialOwned={parseOwnedItems(player.ownedItems)}
        initialCoins={player.coins}
        level={player.campLevel}
        longestStreak={player.longestStreak}
      />
    </div>
  );
}
