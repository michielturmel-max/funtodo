import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { players } from "@/server/db/schema";
import { findCampItem, parseCampItems } from "@/lib/camp";

export type BuyCampItemResult =
  | { ok: true; coins: number; items: string[] }
  | { ok: false; error: string };

export async function buyCampItem(userId: string, itemId: string): Promise<BuyCampItemResult> {
  const item = findCampItem(itemId);
  if (!item) return { ok: false, error: "Dit kampstuk bestaat niet." };

  return db.transaction((tx): BuyCampItemResult => {
    const player = tx.select().from(players).where(eq(players.userId, userId)).get();
    if (!player) return { ok: false, error: "Speler niet gevonden." };

    const items = parseCampItems(player.campItems);
    if (items.includes(item.id)) {
      return { ok: true, coins: player.coins, items };
    }

    if (player.coins < item.price) {
      return { ok: false, error: "Je hebt nog niet genoeg munten." };
    }

    const next = [...items, item.id];
    const coins = player.coins - item.price;

    tx.update(players)
      .set({ coins, campItems: JSON.stringify(next) })
      .where(eq(players.userId, userId))
      .run();

    return { ok: true, coins, items: next };
  });
}
