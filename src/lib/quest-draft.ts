export type QuestDraft = {
  title: string;
  nextAction: string;
  domain: string;
  difficulty: string;
  importance: string;
  estimateMin: string;
  scheduledDate: string;
  scheduledTime: string;
  isMain: boolean;
  subtasks: string;
};

const KEY = "funtodo:quest-draft";

const listeners = new Set<() => void>();
const serverCache = new Map<string, QuestDraft>();

let lastKey: string | null = null;
let lastDraft: QuestDraft | null = null;

export function emptyDraft(today: string): QuestDraft {
  return {
    title: "",
    nextAction: "",
    domain: "craft",
    difficulty: "2",
    importance: "2",
    estimateMin: "25",
    scheduledDate: today,
    scheduledTime: "",
    isMain: false,
    subtasks: "",
  };
}

function notify(): void {
  for (const listener of listeners) listener();
}

function read(today: string): QuestDraft {
  if (typeof window === "undefined") return emptyDraft(today);

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }

  const key = `${today}\n${raw ?? ""}`;
  if (lastKey === key && lastDraft) return lastDraft;

  let draft = emptyDraft(today);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<QuestDraft>;
      draft = { ...draft, ...parsed, scheduledDate: parsed.scheduledDate ?? today };
    } catch {
      // A broken draft is not worth blocking the form.
    }
  }

  lastKey = key;
  lastDraft = draft;
  return draft;
}

export function subscribeDraft(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDraftSnapshot(today: string): QuestDraft {
  return read(today);
}

export function getServerDraftSnapshot(today: string): QuestDraft {
  let draft = serverCache.get(today);
  if (!draft) {
    draft = emptyDraft(today);
    serverCache.set(today, draft);
  }
  return draft;
}

export function saveDraft(today: string, draft: QuestDraft): void {
  const raw = JSON.stringify(draft);
  lastKey = `${today}\n${raw}`;
  lastDraft = draft;
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    // Without storage the draft still survives this visit.
  }
  notify();
}

// Opruimen na verzenden: de opslag gaat leeg, maar het scherm houdt de waarden
// zodat een fout van de server de invoer niet weggooit.
export function forgetDraft(today: string, draft: QuestDraft): void {
  lastKey = `${today}\n`;
  lastDraft = draft;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignored.
  }
}
