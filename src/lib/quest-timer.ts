export type TimerSnapshot = {
  runningSince: number | null;
  elapsedMs: number;
};

const EMPTY: TimerSnapshot = { runningSince: null, elapsedMs: 0 };
const PREFIX = "funtodo:timer:";

const cache = new Map<string, TimerSnapshot>();
const listeners = new Set<() => void>();

function storageKey(questId: string): string {
  return `${PREFIX}${questId}`;
}

function read(questId: string): TimerSnapshot {
  if (typeof window === "undefined") return EMPTY;

  const cached = cache.get(questId);
  if (cached) return cached;

  let snapshot = EMPTY;
  try {
    const raw = window.localStorage.getItem(storageKey(questId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TimerSnapshot>;
      snapshot = {
        runningSince: typeof parsed.runningSince === "number" ? parsed.runningSince : null,
        elapsedMs: typeof parsed.elapsedMs === "number" && parsed.elapsedMs > 0 ? parsed.elapsedMs : 0,
      };
    }
  } catch {
    // A broken timer just starts at zero.
  }

  cache.set(questId, snapshot);
  return snapshot;
}

function notify(): void {
  for (const listener of listeners) listener();
}

function write(questId: string, snapshot: TimerSnapshot): void {
  cache.set(questId, snapshot);
  try {
    window.localStorage.setItem(storageKey(questId), JSON.stringify(snapshot));
  } catch {
    // Without storage the timer still works for this visit.
  }
  notify();
}

export function subscribeTimers(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTimerSnapshot(questId: string): TimerSnapshot {
  return read(questId);
}

export function getServerTimerSnapshot(): TimerSnapshot {
  return EMPTY;
}

export function elapsedOf(snapshot: TimerSnapshot, now: number): number {
  return snapshot.elapsedMs + (snapshot.runningSince ? Math.max(0, now - snapshot.runningSince) : 0);
}

function pauseOthers(exceptQuestId: string): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
  } catch {
    return;
  }

  for (const key of keys) {
    const questId = key.slice(PREFIX.length);
    if (questId === exceptQuestId) continue;
    const snapshot = read(questId);
    if (!snapshot.runningSince) continue;
    write(questId, {
      elapsedMs: snapshot.elapsedMs + (Date.now() - snapshot.runningSince),
      runningSince: null,
    });
  }
}

export function startTimer(questId: string): void {
  pauseOthers(questId);
  const snapshot = read(questId);
  if (snapshot.runningSince) return;
  write(questId, { elapsedMs: snapshot.elapsedMs, runningSince: Date.now() });
}

export function pauseTimer(questId: string): void {
  const snapshot = read(questId);
  if (!snapshot.runningSince) return;
  write(questId, {
    elapsedMs: snapshot.elapsedMs + Math.max(0, Date.now() - snapshot.runningSince),
    runningSince: null,
  });
}

export function resetTimer(questId: string): void {
  write(questId, EMPTY);
}

export function elapsedMinutes(questId: string): number {
  return Math.round(elapsedOf(read(questId), Date.now()) / 60_000);
}

export function takeElapsedMinutes(questId: string): number {
  const minutes = elapsedMinutes(questId);
  resetTimer(questId);
  return minutes;
}
