export type CampItem = {
  id: string;
  label: string;
  description: string;
  price: number;
};

export const CAMP_ITEMS: CampItem[] = [
  {
    id: "vlaggenlijn",
    label: "Vlaggenlijn",
    description: "Kleurige vlaggetjes tussen de tent en de bomen.",
    price: 50,
  },
  {
    id: "lantaarn",
    label: "Lantaarn",
    description: "Een warm licht dat blijft branden als de zon zakt.",
    price: 70,
  },
  {
    id: "houtstapel",
    label: "Houtstapel",
    description: "Droog hout, klaar voor het kampvuur.",
    price: 60,
  },
  {
    id: "bankje",
    label: "Bankje",
    description: "Een plek om uit te rusten na een lange dag.",
    price: 80,
  },
  {
    id: "bloementuin",
    label: "Bloementuin",
    description: "Kleine bloemen die je kamp laten bloeien.",
    price: 90,
  },
  {
    id: "brug",
    label: "Brug",
    description: "Een stevige brug over het pad naar je tent.",
    price: 120,
  },
  {
    id: "vogelhuisje",
    label: "Vogelhuisje",
    description: "Voor de vogels die je 's ochtends wakker maken.",
    price: 100,
  },
];

export function findCampItem(id: string): CampItem | undefined {
  return CAMP_ITEMS.find((item) => item.id === id);
}

export function parseCampItems(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && Boolean(findCampItem(id)));
  } catch {
    return [];
  }
}
