import "server-only";

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/server/db";
import { sessions, users } from "@/server/db/schema";

const COOKIE_NAME = "funtodo_session";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: string;
};

export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86_400_000);

  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  });

  const store = await cookies();
  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto ? proto === "https" : process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date().toISOString())))
    .limit(1);

  return rows[0] ?? null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return user;
}

export async function requireAdminSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/inloggen");
  if (user.role !== "admin") redirect("/admin/inloggen?error=role");
  return user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  store.delete(COOKIE_NAME);
}
