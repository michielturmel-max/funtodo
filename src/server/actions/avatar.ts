"use server";

import { refresh } from "next/cache";
import type { AvatarConfig } from "@/lib/avatar";
import { requireUser } from "@/server/auth/session";
import { buyAvatarItem, saveAvatar, type BuyAvatarResult } from "@/server/repositories/avatar";

export async function saveAvatarAction(config: AvatarConfig): Promise<AvatarConfig> {
  const user = await requireUser();
  const saved = await saveAvatar(user.id, config);
  refresh();
  return saved;
}

export async function buyAvatarItemAction(itemId: string): Promise<BuyAvatarResult> {
  const user = await requireUser();
  const result = await buyAvatarItem(user.id, itemId);
  if (result.ok) refresh();
  return result;
}
