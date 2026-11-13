import "server-only";

import crypto from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { players, quests, users } from "@/server/db/schema";
import type { UserRow } from "@/server/db/schema";
import { hashPassword, verifyPassword } from "@/server/auth/password";

export type UserSummary = {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  questsCompleted: number;
};

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,22}[a-z0-9]$/;
export const MIN_PASSWORD_LENGTH = 8;

export function normaliseUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, normaliseUsername(username)))
    .limit(1);
  return rows[0] ?? null;
}

export async function authenticate(
  username: string,
  password: string,
): Promise<UserRow | null> {
  const user = await findUserByUsername(username);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export async function markLogin(userId: string): Promise<void> {
  await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, userId));
}

export async function ensurePlayer(user: UserRow): Promise<void> {
  const rows = await db.select().from(players).where(eq(players.userId, user.id)).limit(1);
  if (rows[0]) return;

  await db.insert(players).values({
    userId: user.id,
    displayName: user.name,
    timezone: "Europe/Amsterdam",
    createdAt: new Date().toISOString(),
  });
}

export async function listUsers(): Promise<UserSummary[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      questsCompleted: sql<number>`(
        select count(*) from ${quests}
        where ${quests.userId} = ${users.id} and ${quests.status} = 'done'
      )`,
    })
    .from(users)
    .orderBy(asc(users.createdAt));

  return rows.map((row) => ({ ...row, questsCompleted: Number(row.questsCompleted) }));
}

export async function createUser(input: {
  username: string;
  name: string;
  password: string;
  role: "admin" | "member";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const username = normaliseUsername(input.username);

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error: "Gebruik 3 tot 24 tekens: letters, cijfers, punt, streepje of underscore.",
    };
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Het wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens hebben.` };
  }

  const existing = await findUserByUsername(username);
  if (existing) return { ok: false, error: "Die gebruikersnaam bestaat al." };

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.transaction((tx) => {
    tx.insert(users)
      .values({
        id,
        username,
        name: input.name.trim() || username,
        passwordHash: hashPassword(input.password),
        role: input.role,
        createdAt: now,
      })
      .run();

    tx.insert(players)
      .values({
        userId: id,
        displayName: input.name.trim() || username,
        timezone: "Europe/Amsterdam",
        createdAt: now,
      })
      .run();
  });

  return { ok: true };
}

export async function setPassword(userId: string, password: string): Promise<void> {
  await db
    .update(users)
    .set({ passwordHash: hashPassword(password) })
    .where(eq(users.id, userId));
}

export async function changeOwnPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Het nieuwe wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens hebben.` };
  }

  const rows = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  const user = rows[0];
  if (!user) return { ok: false, error: "Gebruiker niet gevonden." };

  if (!verifyPassword(input.currentPassword, user.passwordHash)) {
    return { ok: false, error: "Je huidige wachtwoord klopt niet." };
  }

  await setPassword(user.id, input.newPassword);
  return { ok: true };
}

export async function findUserById(userId: string): Promise<UserRow | null> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}
