import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { completeQuest } from "@/server/repositories/quests";

type SyncItem = {
  id: string;
  questId: string;
  completedAt: string;
};

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let items: SyncItem[] = [];
  try {
    const body = (await request.json()) as { items?: SyncItem[] };
    items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const results: Array<{ id: string; ok: boolean }> = [];

  for (const item of items) {
    if (!item?.questId) {
      results.push({ id: item?.id ?? "unknown", ok: false });
      continue;
    }

    const result = await completeQuest({
      userId: user.id,
      questId: item.questId,
      actualMin: null,
    });

    results.push({ id: item.id, ok: result.ok || result.error === "Deze quest is al af." });
  }

  return NextResponse.json({ ok: true, results });
}
