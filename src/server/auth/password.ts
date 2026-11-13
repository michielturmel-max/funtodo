import "server-only";

import crypto from "node:crypto";

const KEY_LENGTH = 64;

function derive(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt:${salt}:${derive(password, salt)}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(derive(password, salt), "hex");
  if (expected.length !== actual.length) return false;

  return crypto.timingSafeEqual(expected, actual);
}
