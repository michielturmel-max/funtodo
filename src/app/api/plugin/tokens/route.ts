import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/server/auth/session";
import {
  createPluginToken,
  deletePluginToken,
  listPluginTokens,
} from "@/server/repositories/plugin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, tokens: await listPluginTokens(user.id) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const parsed = z
    .object({ label: z.string().trim().max(60).optional() })
    .safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const { token, summary } = await createPluginToken(user.id, parsed.data.label ?? "Omarchy-balk");
  return NextResponse.json({ ok: true, token, tokenInfo: summary });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  let id = url.searchParams.get("id");

  if (!id) {
    const parsed = z
      .object({ id: z.string().min(1).max(64) })
      .safeParse(await request.json().catch(() => null));
    if (parsed.success) id = parsed.data.id;
  }

  if (!id) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const deleted = await deletePluginToken(user.id, id);
  return NextResponse.json({ ok: deleted });
}
