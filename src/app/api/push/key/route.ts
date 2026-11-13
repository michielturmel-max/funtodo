import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { countPushSubscriptions } from "@/server/repositories/push";
import { getVapidKeys } from "@/server/push/vapid";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const keys = getVapidKeys();
  const subscriptions = await countPushSubscriptions(user.id);

  return NextResponse.json({ ok: true, publicKey: keys.publicKey, subscriptions });
}
