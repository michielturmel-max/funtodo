import { NextResponse } from "next/server";
import { z } from "zod";
import { getPluginUser } from "@/server/auth/plugin";
import { DOMAIN_KEYS } from "@/lib/game";
import { todayInZone } from "@/lib/dates";
import { getPlayer } from "@/server/repositories/player";
import {
  completeQuest,
  createQuest,
  deferQuest,
  deleteQuest,
  uncompleteQuest,
} from "@/server/repositories/quests";

const addSchema = z.object({
  action: z.literal("add"),
  title: z.string().trim().min(1).max(120),
  nextAction: z.string().trim().max(160).optional(),
  domain: z.enum(DOMAIN_KEYS).default("craft"),
  estimateMin: z.number().int().min(5).max(240).default(25),
  isMain: z.boolean().default(false),
  scheduledTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
});

const actionSchema = z.object({
  action: z.enum(["complete", "uncomplete", "defer", "delete"]),
  id: z.string().min(1).max(64),
});

const schema = z.union([addSchema, actionSchema]);

export async function POST(request: Request) {
  const user = await getPluginUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const body = parsed.data;

  if (body.action === "add") {
    const player = await getPlayer(user.id);
    const today = todayInZone(player.timezone);
    const result = await createQuest({
      userId: user.id,
      title: body.title,
      nextAction: body.nextAction || body.title,
      domain: body.domain,
      difficulty: 2,
      importance: 2,
      estimateMin: body.estimateMin,
      scheduledDate: today,
      scheduledTime: body.scheduledTime ?? null,
      isMain: body.isMain,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: result.quest.id });
  }

  if (body.action === "complete") {
    const result = await completeQuest({ userId: user.id, questId: body.id, actualMin: null });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, xp: result.xp, streak: result.streak });
  }

  if (body.action === "uncomplete") {
    await uncompleteQuest(user.id, body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "defer") {
    const result = await deferQuest(user.id, body.id);
    return NextResponse.json({ ok: result.ok, becameBoss: result.becameBoss });
  }

  await deleteQuest(user.id, body.id);
  return NextResponse.json({ ok: true });
}
