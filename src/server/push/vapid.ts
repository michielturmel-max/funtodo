import "server-only";

import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";

export type VapidKeys = {
  publicKey: string;
  privateKey: string;
};

let cached: VapidKeys | null = null;

function keyFile(): string {
  const file = process.env.DATABASE_FILE;
  const directory = file ? path.dirname(path.resolve(/*turbopackIgnore: true*/ file)) : path.join(process.cwd(), "data");
  return path.join(directory, "vapid.json");
}

export function getVapidKeys(): VapidKeys {
  if (cached) return cached;

  const fromEnv = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
  if (fromEnv) {
    cached = {
      publicKey: process.env.VAPID_PUBLIC_KEY as string,
      privateKey: process.env.VAPID_PRIVATE_KEY as string,
    };
    return cached;
  }

  const file = keyFile();
  if (fs.existsSync(file)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<VapidKeys>;
      if (parsed.publicKey && parsed.privateKey) {
        cached = { publicKey: parsed.publicKey, privateKey: parsed.privateKey };
        return cached;
      }
    } catch {
      // Fall through and generate a fresh pair.
    }
  }

  const generated = webpush.generateVAPIDKeys();
  cached = generated;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(generated, null, 2), { mode: 0o600 });
  return cached;
}

export function vapidSubject(): string {
  return process.env.VAPID_SUBJECT ?? "mailto:beheerder@example.com";
}
