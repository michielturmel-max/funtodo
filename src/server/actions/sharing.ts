"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/server/auth/session";
import { setShareActivity } from "@/server/repositories/expedition";

export async function setShareActivityAction(share: boolean): Promise<{ ok: true }> {
  const user = await requireUser();
  await setShareActivity(user.id, share);
  refresh();
  return { ok: true };
}
