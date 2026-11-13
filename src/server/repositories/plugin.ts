import "server-only";

import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { pluginTokens, users } from "@/server/db/schema";

const TOKEN_PREFIX = "ft_";
const TOKEN_BYTES = 24;

export type PluginTokenSummary = {
  id: string;
  label: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type PluginUser = {
  id: string;
  username: string;
  name: string;
  role: string;
};

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function summary(row: typeof pluginTokens.$inferSelect): PluginTokenSummary {
  return {
    id: row.id,
    label: row.label,
    prefix: row.prefix,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
  };
}

export async function createPluginToken(
  userId: string,
  label: string,
): Promise<{ token: string; summary: PluginTokenSummary }> {
  const token = TOKEN_PREFIX + crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  const row = {
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashToken(token),
    prefix: token.slice(0, 10),
    label: label.trim().slice(0, 60) || "Omarchy-balk",
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };

  await db.insert(pluginTokens).values(row);
  return { token, summary: summary(row) };
}

export async function listPluginTokens(userId: string): Promise<PluginTokenSummary[]> {
  const rows = await db
    .select()
    .from(pluginTokens)
    .where(eq(pluginTokens.userId, userId))
    .orderBy(desc(pluginTokens.createdAt));

  return rows.map(summary);
}

export async function deletePluginToken(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(pluginTokens)
    .where(and(eq(pluginTokens.id, id), eq(pluginTokens.userId, userId)))
    .returning({ id: pluginTokens.id });

  return rows.length > 0;
}

export async function authenticatePluginToken(token: string): Promise<PluginUser | null> {
  if (!token.startsWith(TOKEN_PREFIX) || token.length > 128) return null;

  const rows = await db
    .select({
      tokenId: pluginTokens.id,
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
    })
    .from(pluginTokens)
    .innerJoin(users, eq(users.id, pluginTokens.userId))
    .where(eq(pluginTokens.tokenHash, hashToken(token)))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  await db
    .update(pluginTokens)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(pluginTokens.id, user.tokenId));

  return { id: user.id, username: user.username, name: user.name, role: user.role };
}
