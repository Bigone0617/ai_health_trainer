import type { ScheduleDayKey } from "./types";

const LOCALE = "ko-KR";

const DAY_KEYS: ScheduleDayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getScheduleDayKey(d: Date): ScheduleDayKey {
  return DAY_KEYS[d.getDay()];
}

export function formatDisplayDate(iso: string): string {
  const dt = parseLocalDate(iso);
  return dt.toLocaleDateString(LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  const dt = parseLocalDate(iso);
  return dt.toLocaleDateString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
