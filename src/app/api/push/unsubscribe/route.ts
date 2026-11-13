import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/server/auth/session";
import { removePushSubscription } from "@/server/repositories/push";

const schema = z.object({ endpoint: z.string().url().max(2048) });

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  await removePushSubscription(user.id, parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}
