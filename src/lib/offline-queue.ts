import { openDB } from "idb";

const DB_NAME = "funtodo";
const STORE = "outbox";

type QueueItem = {
  id: string;
  questId: string;
  completedAt: string;
};

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    },
  });
}

export async function enqueueCompletion(questId: string): Promise<void> {
  const db = await getDb();
  const item: QueueItem = {
    id: crypto.randomUUID(),
    questId,
    completedAt: new Date().toISOString(),
  };
  await db.put(STORE, item);
}

export async function pendingCompletions(): Promise<number> {
  const db = await getDb();
  return db.count(STORE);
}

export async function flushCompletions(): Promise<{ synced: number; left: number }> {
  const db = await getDb();
  const items = (await db.getAll(STORE)) as QueueItem[];
  if (items.length === 0) return { synced: 0, left: 0 };

  const response = await fetch("/api/sync/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    return { synced: 0, left: items.length };
  }

  const data = (await response.json()) as { results?: Array<{ id: string; ok: boolean }> };
  let synced = 0;

  for (const result of data.results ?? []) {
    if (result.ok) {
      await db.delete(STORE, result.id);
      synced += 1;
    }
  }

  return { synced, left: items.length - synced };
}
