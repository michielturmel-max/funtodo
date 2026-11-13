export const DOMAINS = {
  body: {
    label: "Lijf",
    blurb: "Beweging, rust, eten",
    color: "var(--color-moss)",
    ink: "#3f5b3c",
  },
  mind: {
    label: "Geest",
    blurb: "Leren, lezen, denken",
    color: "var(--color-sky)",
    ink: "#3c5a68",
  },
  craft: {
    label: "Vak",
    blurb: "Werk dat blijft liggen",
    color: "var(--color-gold)",
    ink: "#6b5119",
  },
  social: {
    label: "Samen",
    blurb: "Mensen, afspraken, hulp",
    color: "var(--color-ember)",
    ink: "#7a2f18",
  },
} as const;

export type Domain = keyof typeof DOMAINS;

export const DOMAIN_KEYS = Object.keys(DOMAINS) as Domain[];

export const DIFFICULTIES = {
  1: { label: "Klein", hint: "15 min of minder" },
  2: { label: "Stevig", hint: "ongeveer een half uur" },
  3: { label: "Zwaar", hint: "een uur of meer" },
} as const;

export const IMPORTANCES = {
  1: { label: "Fijn als het lukt" },
  2: { label: "Telt mee" },
  3: { label: "Dit is de dag" },
} as const;

export const STATUSES = ["planned", "active", "done", "dropped"] as const;
export type QuestStatus = (typeof STATUSES)[number];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateQuestXp(input: {
  difficulty: number;
  importance: number;
  isMain: boolean;
  plannedAhead: boolean;
  estimateMin: number;
  actualMin?: number | null;
}): number {
  const base = input.difficulty * input.importance * 10;
  const planning = input.plannedAhead ? 1.5 : 0.5;
  const accurate = input.actualMin
    ? Math.abs(input.actualMin - input.estimateMin) <= Math.max(5, input.estimateMin * 0.3)
      ? 1.15
      : 1
    : 1;
  const main = input.isMain ? 1.2 : 1;
  return Math.round(clamp(base * planning * accurate * main, 5, 220));
}

export function bossHpFor(difficulty: number, importance: number): number {
  return 40 + difficulty * 30 + importance * 20;
}

export function levelForXp(xp: number): {
  level: number;
  intoLevel: number;
  needed: number;
  progress: number;
} {
  let level = 1;
  let remaining = Math.max(0, xp);
  let needed = xpForLevel(1);

  while (remaining >= needed && level < 99) {
    remaining -= needed;
    level += 1;
    needed = xpForLevel(level);
  }

  return {
    level,
    intoLevel: remaining,
    needed,
    progress: needed === 0 ? 0 : Math.min(1, remaining / needed),
  };
}

export function xpForLevel(level: number): number {
  return Math.round(60 * Math.pow(level, 1.45));
}

export function advanceStreak(input: {
  lastDate: string | null;
  today: string;
  current: number;
  longest: number;
  graceUsed: number;
  graceMonth: string | null;
  gap: number;
}): {
  streak: number;
  longest: number;
  graceUsed: number;
  graceMonth: string;
} {
  const month = input.today.slice(0, 7);

  if (!input.lastDate) {
    return { streak: 1, longest: Math.max(1, input.longest), graceUsed: input.graceUsed, graceMonth: month };
  }

  if (input.lastDate === input.today) {
    return {
      streak: Math.max(1, input.current),
      longest: Math.max(input.longest, input.current),
      graceUsed: input.graceUsed,
      graceMonth: input.graceMonth ?? month,
    };
  }

  if (input.gap === 1) {
    const streak = Math.max(1, input.current) + 1;
    return { streak, longest: Math.max(input.longest, streak), graceUsed: input.graceUsed, graceMonth: month };
  }

  const canUseGrace = input.gap === 2 && (input.graceMonth !== month || input.graceUsed < 1);

  if (canUseGrace) {
    const streak = Math.max(1, input.current) + 1;
    const graceUsed = input.graceMonth === month ? input.graceUsed + 1 : 1;
    return { streak, longest: Math.max(input.longest, streak), graceUsed, graceMonth: month };
  }

  return { streak: 1, longest: Math.max(1, input.longest), graceUsed: input.graceUsed, graceMonth: month };
}

export function streakLabel(days: number): string {
  if (days <= 0) return "Nog geen vuur";
  if (days === 1) return "Eerste vonk";
  if (days < 4) return "Klein vuur";
  if (days < 8) return "Kampvuur";
  if (days < 15) return "Vuurtoren";
  if (days < 31) return "Grote brand";
  return "Eeuwig vuur";
}
