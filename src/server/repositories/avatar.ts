import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { players } from "@/server/db/schema";
import {
  AVATAR_GROUPS,
  findAvatarOption,
  findAvatarOptionIn,
  isAvatarOptionUnlocked,
  parseAvatar,
  parseOwnedItems,
  sanitizeAvatar,
  type AvatarConfig,
} from "@/lib/avatar";
import { getPlayer } from "./player";

export type BuyAvatarResult =
  | { ok: true; coins: number; owned: string[] }
  | { ok: false; error: string };

export async function saveAvatar(userId: string, config: AvatarConfig): Promise<AvatarConfig> {
  const player = await getPlayer(userId);
  const current = parseAvatar(player.avatar);
  const context = {
    level: player.campLevel,
    longestStreak: player.longestStreak,
    owned: parseOwnedItems(player.ownedItems),
  };
  const clean = sanitizeAvatar(config);

  for (const group of AVATAR_GROUPS) {
    const option = findAvatarOptionIn(group.key, clean[group.key]);
    if (!option || !isAvatarOptionUnlocked(option, context)) {
      clean[group.key] = current[group.key];
    }
  }

  await db
    .update(players)
    .set({ avatar: JSON.stringify(clean) })
    .where(eq(players.userId, userId));

  return clean;
}

export async function buyAvatarItem(userId: string, itemId: string): Promise<BuyAvatarResult> {
  const item = findAvatarOption(itemId);
  if (!item || item.unlock.kind !== "coins") {
    return { ok: false, error: "Dit item is niet te koop." };
  }

  const price = item.unlock.price;

  return db.transaction((tx): BuyAvatarResult => {
    const player = tx.select().from(players).where(eq(players.userId, userId)).get();
    if (!player) return { ok: false, error: "Speler niet gevonden." };

    const owned = parseOwnedItems(player.ownedItems);
    if (owned.includes(item.id)) {
      return { ok: true, coins: player.coins, owned };
    }

    if (player.coins < price) {
      return { ok: false, error: "Je hebt nog niet genoeg munten." };
    }

    const nextOwned = [...owned, item.id];
    const coins = player.coins - price;

    tx.update(players)
      .set({ coins, ownedItems: JSON.stringify(nextOwned) })
      .where(eq(players.userId, userId))
      .run();

    return { ok: true, coins, owned: nextOwned };
  });
}
