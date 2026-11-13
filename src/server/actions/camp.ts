"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/server/auth/session";
import { buyCampItem, type BuyCampItemResult } from "@/server/repositories/camp";

export async function buyCampItemAction(itemId: string): Promise<BuyCampItemResult> {
  const user = await requireUser();
  const result = await buyCampItem(user.id, itemId);
  if (result.ok) refresh();
  return result;
}
