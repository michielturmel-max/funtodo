import { NextResponse } from "next/server";
import { z } from "zod";
import { createPluginToken } from "@/server/repositories/plugin";
import { authenticate, ensurePlayer, markLogin } from "@/server/repositories/users";

const schema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256),
  label: z.string().trim().max(60).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Vul je gebruikersnaam en wachtwoord in." }, { status: 400 });
  }

  const user = await authenticate(parsed.data.username, parsed.data.password);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Gebruikersnaam of wachtwoord klopt niet." },
      { status: 401 },
    );
  }

  await ensurePlayer(user);
  await markLogin(user.id);

  const { token, summary } = await createPluginToken(
    user.id,
    parsed.data.label ?? "Omarchy-balk",
  );

  return NextResponse.json({
    ok: true,
    token,
    label: summary.label,
    prefix: summary.prefix,
  });
}
