import type { ScheduleDayKey } from "./types";

export const SCHEDULE_DAYS: { key: ScheduleDayKey; label: string }[] = [
  { key: "monday", label: "월요일" },
  { key: "tuesday", label: "화요일" },
  { key: "wednesday", label: "수요일" },
  { key: "thursday", label: "목요일" },
  { key: "friday", label: "금요일" },
  { key: "saturday", label: "토요일" },
  { key: "sunday", label: "일요일" },
];
