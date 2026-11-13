import { dateInZone, timeInZone } from "./dates";

export const RING_WINDOW_MIN = 30;

export type AlarmState = "upcoming" | "ringing" | "missed";

export type AlarmInfo = {
  time: string;
  minutesUntil: number;
  state: AlarmState;
  snoozed: boolean;
};

export function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function alarmInfo(input: {
  date: string | null;
  time: string | null;
  snoozeUntil: string | null;
  timezone: string;
  now?: Date;
}): AlarmInfo | null {
  if (!input.date || !input.time) return null;

  const now = input.now ?? new Date();
  const today = dateInZone(now, input.timezone);
  if (input.date !== today) return null;

  const [hours, minutes] = timeInZone(now, input.timezone).split(":").map(Number);
  const nowMinutes = hours * 60 + minutes;

  let time = input.time;
  let snoozed = false;

  if (input.snoozeUntil) {
    const until = new Date(input.snoozeUntil);
    if (!Number.isNaN(until.getTime()) && dateInZone(until, input.timezone) === today) {
      time = timeInZone(until, input.timezone);
      snoozed = true;
    }
  }

  const minutesUntil = minutesOfDay(time) - nowMinutes;
  const state: AlarmState =
    minutesUntil >= 0 ? "upcoming" : minutesUntil >= -RING_WINDOW_MIN ? "ringing" : "missed";

  return { time, minutesUntil, state, snoozed };
}
