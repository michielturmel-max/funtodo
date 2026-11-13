export type AvatarConfig = {
  skin: string;
  hair: string;
  hairColor: string;
  outfit: string;
  outfitColor: string;
  accessory: string;
};

export type AvatarUnlock =
  | { kind: "free" }
  | { kind: "coins"; price: number }
  | { kind: "level"; level: number }
  | { kind: "streak"; days: number };

export type AvatarOption = {
  id: string;
  label: string;
  unlock: AvatarUnlock;
  color?: string;
};

export type AvatarGroup = {
  key: keyof AvatarConfig;
  label: string;
  kind: "color" | "style";
  options: AvatarOption[];
};

const free: AvatarUnlock = { kind: "free" };

export const SKIN_TONES: AvatarOption[] = [
  { id: "licht", label: "Licht", unlock: free, color: "#f2d3b8" },
  { id: "zacht", label: "Zacht", unlock: free, color: "#e6b98f" },
  { id: "amber", label: "Amber", unlock: free, color: "#cf9466" },
  { id: "kastanje", label: "Kastanje", unlock: free, color: "#a86a44" },
  { id: "cacao", label: "Cacao", unlock: free, color: "#7c4a2d" },
  { id: "ebbe", label: "Ebbe", unlock: free, color: "#523020" },
];

export const HAIR_STYLES: AvatarOption[] = [
  { id: "kort", label: "Kort", unlock: free },
  { id: "krullen", label: "Krullen", unlock: free },
  { id: "kaal", label: "Kaal", unlock: free },
  { id: "knot", label: "Knot", unlock: { kind: "level", level: 2 } },
  { id: "lang", label: "Lang", unlock: { kind: "coins", price: 90 } },
  { id: "staart", label: "Staart", unlock: { kind: "coins", price: 120 } },
];

export const HAIR_COLORS: AvatarOption[] = [
  { id: "zwart", label: "Zwart", unlock: free, color: "#24211d" },
  { id: "bruin", label: "Bruin", unlock: free, color: "#5a3a25" },
  { id: "blond", label: "Blond", unlock: free, color: "#c8954f" },
  { id: "ros", label: "Ros", unlock: free, color: "#a8562f" },
  { id: "grijs", label: "Grijs", unlock: { kind: "coins", price: 50 }, color: "#a7a49a" },
  { id: "mosgroen", label: "Mosgroen", unlock: { kind: "coins", price: 80 }, color: "#4f6b4a" },
];

export const OUTFIT_STYLES: AvatarOption[] = [
  { id: "tuniek", label: "Tuniek", unlock: free },
  { id: "trui", label: "Trui", unlock: free },
  { id: "poncho", label: "Poncho", unlock: { kind: "coins", price: 100 } },
  { id: "reisjas", label: "Reisjas", unlock: { kind: "level", level: 3 } },
];

export const OUTFIT_COLORS: AvatarOption[] = [
  { id: "mos", label: "Mos", unlock: free, color: "#4f6b4a" },
  { id: "ember", label: "Ember", unlock: free, color: "#c14f2a" },
  { id: "goud", label: "Goud", unlock: free, color: "#c69a46" },
  { id: "sky", label: "Sky", unlock: free, color: "#5f8899" },
  { id: "inkt", label: "Inkt", unlock: { kind: "coins", price: 40 }, color: "#2c3b33" },
  { id: "duin", label: "Duin", unlock: { kind: "coins", price: 60 }, color: "#c9b995" },
];

export const ACCESSORIES: AvatarOption[] = [
  { id: "geen", label: "Geen", unlock: free },
  { id: "bril", label: "Bril", unlock: free },
  { id: "muts", label: "Muts", unlock: { kind: "level", level: 2 } },
  { id: "bloem", label: "Bloem", unlock: { kind: "level", level: 3 } },
  { id: "sjaal", label: "Sjaal", unlock: { kind: "coins", price: 70 } },
  { id: "ster", label: "Ster", unlock: { kind: "streak", days: 7 } },
];

export const AVATAR_GROUPS: AvatarGroup[] = [
  { key: "skin", label: "Huid", kind: "color", options: SKIN_TONES },
  { key: "hair", label: "Kapsel", kind: "style", options: HAIR_STYLES },
  { key: "hairColor", label: "Haarkleur", kind: "color", options: HAIR_COLORS },
  { key: "outfit", label: "Kleding", kind: "style", options: OUTFIT_STYLES },
  { key: "outfitColor", label: "Kledingkleur", kind: "color", options: OUTFIT_COLORS },
  { key: "accessory", label: "Accessoire", kind: "style", options: ACCESSORIES },
];

export const ALL_AVATAR_OPTIONS: AvatarOption[] = AVATAR_GROUPS.flatMap((group) => group.options);

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: "zacht",
  hair: "kort",
  hairColor: "bruin",
  outfit: "tuniek",
  outfitColor: "mos",
  accessory: "geen",
};

export function findAvatarOption(id: string): AvatarOption | undefined {
  return ALL_AVATAR_OPTIONS.find((option) => option.id === id);
}

export function findAvatarOptionIn(group: keyof AvatarConfig, id: string): AvatarOption | undefined {
  const match = AVATAR_GROUPS.find((entry) => entry.key === group);
  return match?.options.find((option) => option.id === id);
}

export function sanitizeAvatar(value: unknown): AvatarConfig {
  const source = value && typeof value === "object" ? (value as Partial<Record<keyof AvatarConfig, unknown>>) : {};
  const result = { ...DEFAULT_AVATAR };

  for (const group of AVATAR_GROUPS) {
    const candidate = source[group.key];
    if (typeof candidate === "string" && group.options.some((option) => option.id === candidate)) {
      result[group.key] = candidate;
    }
  }

  return result;
}

export function parseAvatar(raw: string | null | undefined): AvatarConfig {
  if (!raw) return DEFAULT_AVATAR;
  try {
    return sanitizeAvatar(JSON.parse(raw));
  } catch {
    return DEFAULT_AVATAR;
  }
}

export function parseOwnedItems(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is string => typeof item === "string" && Boolean(findAvatarOption(item)),
    );
  } catch {
    return [];
  }
}

export function avatarOptionColor(group: keyof AvatarConfig, id: string): string | undefined {
  return findAvatarOptionIn(group, id)?.color;
}

export type AvatarUnlockContext = {
  level: number;
  longestStreak: number;
  owned: string[];
};

export function isAvatarOptionUnlocked(option: AvatarOption, context: AvatarUnlockContext): boolean {
  switch (option.unlock.kind) {
    case "free":
      return true;
    case "coins":
      return context.owned.includes(option.id);
    case "level":
      return context.level >= option.unlock.level;
    case "streak":
      return context.longestStreak >= option.unlock.days;
  }
}

export function avatarUnlockLabel(unlock: AvatarUnlock): string {
  switch (unlock.kind) {
    case "free":
      return "Vrij";
    case "coins":
      return `${unlock.price} munten`;
    case "level":
      return `level ${unlock.level}`;
    case "streak":
      return `${unlock.days} dagen vuur`;
  }
}
