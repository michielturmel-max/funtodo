import { NextResponse } from "next/server";
import { z } from "zod";
import { getPluginUser } from "@/server/auth/plugin";
import { getSessionUser } from "@/server/auth/session";
import { snoozeAlarm } from "@/server/repositories/quests";

const schema = z.object({
  id: z.string().min(1).max(64),
  minutes: z.number().int().min(1).max(120).default(10),
});

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  const user = sessionUser ?? (await getPluginUser(request));
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const result = await snoozeAlarm(user.id, parsed.data.id, parsed.data.minutes);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "geen wekker voor deze quest" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, snoozeUntil: result.snoozeUntil });
}
