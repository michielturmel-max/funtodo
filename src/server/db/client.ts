import "server-only";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { hashPassword } from "@/server/auth/password";
import * as schema from "./schema";

function seedAdmin(sqlite: Database.Database) {
  const username = (process.env.ADMIN_USERNAME ?? "beheerder").trim().toLowerCase();
  const name = process.env.ADMIN_NAME ?? "Beheerder";
  const password = process.env.ADMIN_PASSWORD;

  const existing = sqlite
    .prepare("select id from users where username = ?")
    .get(username) as { id: string } | undefined;

  if (existing) return;

  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD ontbreekt. Zet ADMIN_USERNAME, ADMIN_NAME en ADMIN_PASSWORD in .env.local voordat de database voor het eerst wordt aangemaakt.",
    );
  }

  const now = new Date().toISOString();
  sqlite
    .prepare(
      "insert into users (id, username, name, password_hash, role, created_at) values (?, ?, ?, ?, 'admin', ?)",
    )
    .run(crypto.randomUUID(), username, name, hashPassword(password), now);
}

function createClient() {
  const file = process.env.DATABASE_FILE;
  const absolute = file
    ? path.resolve(/*turbopackIgnore: true*/ file)
    : path.join(process.cwd(), "data", "funtodo.db");
  fs.mkdirSync(path.dirname(absolute), { recursive: true });

  const sqlite = new Database(absolute);
  sqlite.pragma(process.env.NODE_ENV === "production" ? "journal_mode = WAL" : "journal_mode = DELETE");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  const database = drizzle(sqlite, { schema });

  const migrations = path.join(process.cwd(), "drizzle");
  if (fs.existsSync(migrations)) {
    migrate(database, { migrationsFolder: migrations });
    seedAdmin(sqlite);
  }

  return database;
}

type Client = ReturnType<typeof createClient>;

const globalForDb = globalThis as unknown as { __funtodoDb?: Client };

export const db: Client = globalForDb.__funtodoDb ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__funtodoDb = db;
}

export { schema };
