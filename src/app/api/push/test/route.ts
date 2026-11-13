import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { sendPushToUser } from "@/server/push/send";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await sendPushToUser(user.id, {
    title: "Funtodo · proefmelding",
    body: "Push werkt. Je wekker komt ook als de app dicht is.",
    url: "/vandaag",
    tag: "funtodo-test",
    kind: "test",
  });

  return NextResponse.json({ ok: result.sent > 0, ...result });
}
