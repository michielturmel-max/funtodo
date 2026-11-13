export function dateInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayInZone(timeZone: string): string {
  return dateInZone(new Date(), timeZone);
}

export function timeInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function addDays(date: string, amount: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + amount));
  return next.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function formatDay(date: string, timeZone: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function isToday(date: string | null, timeZone: string): boolean {
  return date === todayInZone(timeZone);
}
