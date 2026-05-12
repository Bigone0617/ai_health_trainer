import {
  BUNDLED_DEFAULT_ROUTINE_NAMES,
  createSampleRoutines,
  createSampleSchedule,
} from "./sampleData";
import type { Routine, WeeklySchedule } from "./types";
import { STORAGE_DISMISSED_DEFAULT_ROUTINES } from "./storageKeys";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export function isBundledDefaultRoutineName(name: string): boolean {
  return (BUNDLED_DEFAULT_ROUTINE_NAMES as readonly string[]).includes(name);
}

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_DISMISSED_DEFAULT_ROUTINES);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(arr)
        ? arr.filter((x): x is string => typeof x === "string")
        : []
    );
  } catch {
    return new Set();
  }
}

function saveDismissed(next: Set<string>): void {
  localStorage.setItem(
    STORAGE_DISMISSED_DEFAULT_ROUTINES,
    JSON.stringify([...next])
  );
}

/** 해당 이름의 기본 번들 루틴을 앞으로 자동 추가하지 않음 */
export function dismissBundledDefaultRoutineName(name: string): void {
  if (!isBundledDefaultRoutineName(name)) return;
  const d = loadDismissed();
  d.add(name);
  saveDismissed(d);
}

export function clearBundledDefaultDismissed(): void {
  localStorage.removeItem(STORAGE_DISMISSED_DEFAULT_ROUTINES);
}

/** 이미 있는 루틴은 두고, 번들에 있으나 없는 루틴만 뒤에 붙입니다(삭제로 제외한 이름은 제외). */
export function mergeBundledDefaultRoutines(existing: Routine[]): {
  next: Routine[];
  changed: boolean;
} {
  if (typeof window === "undefined") return { next: existing, changed: false };
  const dismissed = loadDismissed();
  const byName = new Map(existing.map((r) => [r.name, r]));
  const next = [...existing];
  let changed = false;
  const templates = createSampleRoutines();
  for (const t of templates) {
    if (dismissed.has(t.name)) continue;
    if (!byName.has(t.name)) {
      next.push(t);
      byName.set(t.name, t);
      changed = true;
    }
  }
  return { next, changed };
}

export function scheduleFullyEmpty(schedule: WeeklySchedule): boolean {
  for (const d of DAY_KEYS) {
    const v = schedule[d];
    if (v !== null && v !== undefined && v !== "") return false;
  }
  return true;
}

/**
 * 주간 스케줄이 비어 있고 기본 6개 루틴이 모두 있을 때만 월~토 스케줄을 채웁니다.
 */
export function buildDefaultScheduleIfApplicable(
  routines: Routine[],
  currentSchedule: WeeklySchedule
): WeeklySchedule | null {
  if (!scheduleFullyEmpty(currentSchedule)) return null;
  const byName = new Map(routines.map((r) => [r.name, r]));
  const ordered: Routine[] = [];
  for (const name of BUNDLED_DEFAULT_ROUTINE_NAMES) {
    const r = byName.get(name);
    if (!r) return null;
    ordered.push(r);
  }
  return createSampleSchedule(ordered);
}
