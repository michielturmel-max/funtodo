"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DOMAIN_KEYS } from "@/lib/game";
import { todayInZone } from "@/lib/dates";
import { requireUser } from "@/server/auth/session";
import { getPlayer } from "@/server/repositories/player";
import {
  addFocusSession,
  addSubtask,
  completeQuest,
  createQuest,
  deferQuest,
  deleteQuest,
  scheduleQuest,
  startQuest,
  toggleSubtask,
  uncompleteQuest,
  unscheduleQuest,
} from "@/server/repositories/quests";

const questSchema = z.object({
  title: z.string().trim().min(2, "Geef de quest een naam.").max(120),
  nextAction: z.string().trim().min(2, "Wat is de eerstvolgende fysieke stap?").max(200),
  domain: z.enum(DOMAIN_KEYS as [string, ...string[]]),
  difficulty: z.coerce.number().int().min(1).max(3),
  importance: z.coerce.number().int().min(1).max(3),
  estimateMin: z.coerce.number().int().min(5).max(480),
  scheduledDate: z.string().optional(),
  scheduledTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Kies een geldige tijd.")
    .optional()
    .or(z.literal("")),
  isMain: z.boolean(),
  subtasks: z.string().optional(),
});

function parseDate(raw: string | undefined, today: string): string | null {
  if (!raw || raw === "") return null;
  if (raw === "today") return today;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

export type NewQuestState = { error?: string };

export async function createQuestStateAction(
  _prev: NewQuestState,
  formData: FormData,
): Promise<NewQuestState> {
  const user = await requireUser();
  const player = await getPlayer(user.id);
  const today = todayInZone(player.timezone);

  const parsed = questSchema.safeParse({
    title: formData.get("title"),
    nextAction: formData.get("nextAction"),
    domain: formData.get("domain"),
    difficulty: formData.get("difficulty"),
    importance: formData.get("importance"),
    estimateMin: formData.get("estimateMin"),
    scheduledDate: formData.get("scheduledDate") ?? undefined,
    scheduledTime: formData.get("scheduledTime") ?? undefined,
    isMain: formData.get("isMain") === "on",
    subtasks: formData.get("subtasks") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  }

  const data = parsed.data;
  const scheduledDate = parseDate(data.scheduledDate, today);
  const result = await createQuest({
    userId: user.id,
    title: data.title,
    nextAction: data.nextAction,
    domain: data.domain as (typeof DOMAIN_KEYS)[number],
    difficulty: data.difficulty,
    importance: data.importance,
    estimateMin: data.estimateMin,
    scheduledDate,
    scheduledTime: scheduledDate && data.scheduledTime ? data.scheduledTime : null,
    isMain: data.isMain,
    subtaskTitles: (data.subtasks ?? "")
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean),
  });

  if (!result.ok) return { error: result.error };

  refresh();
  redirect("/vandaag");
}

export async function completeQuestAction(
  questId: string,
  actualMin?: number | null,
): Promise<{ ok: true; xp: number; streak: number } | { ok: false; error: string }> {
  const user = await requireUser();
  const result = await completeQuest({ userId: user.id, questId, actualMin });
  if (!result.ok) return result;
  refresh();
  return { ok: true, xp: result.xp, streak: result.streak };
}

export async function uncompleteQuestAction(questId: string): Promise<void> {
  const user = await requireUser();
  await uncompleteQuest(user.id, questId);
  refresh();
}

export async function startQuestAction(questId: string): Promise<void> {
  const user = await requireUser();
  await startQuest(user.id, questId);
  refresh();
}

export async function deferQuestAction(
  questId: string,
): Promise<{ ok: boolean; becameBoss: boolean }> {
  const user = await requireUser();
  const result = await deferQuest(user.id, questId);
  refresh();
  return result;
}

export async function deleteQuestAction(questId: string): Promise<void> {
  const user = await requireUser();
  await deleteQuest(user.id, questId);
  refresh();
}

export async function scheduleQuestAction(questId: string, date: string): Promise<void> {
  const user = await requireUser();
  await scheduleQuest(user.id, questId, date);
  refresh();
}

export async function unscheduleQuestAction(questId: string): Promise<void> {
  const user = await requireUser();
  await unscheduleQuest(user.id, questId);
  refresh();
}

export async function addFocusAction(
  questId: string,
  minutes: number,
): Promise<{ damage: number; bossHp: number }> {
  const user = await requireUser();
  const result = await addFocusSession({ userId: user.id, questId, minutes });
  refresh();
  return result;
}

export async function addSubtaskAction(questId: string, title: string): Promise<void> {
  const user = await requireUser();
  await addSubtask(user.id, questId, title);
  refresh();
}

export async function toggleSubtaskAction(subtaskId: string, done: boolean): Promise<void> {
  const user = await requireUser();
  await toggleSubtask(user.id, subtaskId, done);
  refresh();
}
