"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import {
  createSession,
  destroySession,
  requireAdminSession,
  requireUser,
} from "@/server/auth/session";
import {
  authenticate,
  changeOwnPassword,
  createUser,
  ensurePlayer,
  findUserById,
  markLogin,
  MIN_PASSWORD_LENGTH,
  setPassword,
} from "@/server/repositories/users";
import type { UserRow } from "@/server/db/schema";

export type AuthState = { error?: string; ok?: boolean; message?: string };

const loginSchema = z.object({
  username: z.string().trim().min(1, "Vul je gebruikersnaam in."),
  password: z.string().min(1, "Vul je wachtwoord in."),
});

const failedAttempts = new Map<string, number[]>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 10;

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const recent = (failedAttempts.get(key) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  failedAttempts.set(key, recent);
  return recent.length >= RATE_LIMIT;
}

function recordFailure(key: string): void {
  const recent = failedAttempts.get(key) ?? [];
  recent.push(Date.now());
  failedAttempts.set(key, recent);
}

async function checkCredentials(
  formData: FormData,
): Promise<{ ok: true; user: UserRow } | { ok: false; error: string }> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Controleer je gegevens." };
  }

  const key = parsed.data.username.trim().toLowerCase();
  if (tooManyAttempts(key)) {
    return { ok: false, error: "Te veel pogingen. Probeer het over tien minuten opnieuw." };
  }

  const user = await authenticate(parsed.data.username, parsed.data.password);
  if (!user) {
    recordFailure(key);
    return { ok: false, error: "Gebruikersnaam of wachtwoord klopt niet." };
  }

  failedAttempts.delete(key);
  return { ok: true, user };
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const result = await checkCredentials(formData);
  if (!result.ok) return { error: result.error };

  await markLogin(result.user.id);
  await ensurePlayer(result.user);
  await createSession(result.user.id);
  redirect("/vandaag");
}

export async function adminLoginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const result = await checkCredentials(formData);
  if (!result.ok) return { error: result.error };

  if (result.user.role !== "admin") {
    return { error: "Dit account heeft geen beheerdersrechten." };
  }

  await markLogin(result.user.id);
  await ensurePlayer(result.user);
  await createSession(result.user.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function adminLogoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/inloggen");
}

const newUserSchema = z.object({
  username: z.string().trim().min(3, "Kies een gebruikersnaam van minstens 3 tekens."),
  name: z.string().trim().min(1, "Vul een weergavenaam in.").max(40),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Minstens ${MIN_PASSWORD_LENGTH} tekens.`),
  role: z.enum(["admin", "member"]),
});

export async function createUserAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  await requireAdminSession();

  const parsed = newUserSchema.safeParse({
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role") ?? "member",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  }

  const result = await createUser(parsed.data);
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: true, message: `${parsed.data.username} is aangemaakt.` };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const admin = await requireAdminSession();

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId) return { error: "Onbekende gebruiker." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Minstens ${MIN_PASSWORD_LENGTH} tekens.` };
  }

  const user = await findUserById(userId);
  if (!user) return { error: "Gebruiker niet gevonden." };

  await setPassword(userId, password);
  refresh();

  if (user.id === admin.id) {
    return { ok: true, message: "Je eigen wachtwoord is vervangen. Gebruik het bij je volgende login." };
  }

  return { ok: true, message: `Wachtwoord van ${user.username} is vervangen.` };
}

export async function changePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await requireUser();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword !== confirmPassword) {
    return { error: "De nieuwe wachtwoorden zijn niet gelijk." };
  }

  const result = await changeOwnPassword({
    userId: user.id,
    currentPassword,
    newPassword,
  });

  if (!result.ok) return { error: result.error };

  return { ok: true, message: "Je wachtwoord is gewijzigd." };
}
