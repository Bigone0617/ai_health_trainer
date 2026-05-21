import type { Routine, RoutineExercise } from "./types";

const PREFIX = "nextset:workoutScroll:";

export type WorkoutScrollAnchor = {
  exerciseId: string;
  setIndex: number;
  /** 해당 완료 버튼이 보이도록 맞춘 문서 기준 scrollY */
  scrollY: number;
};

function sortExercises(exercises: RoutineExercise[]): RoutineExercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}

function scrollStorageKey(routineId: string, date: string): string {
  return `${PREFIX}${routineId}:${date}`;
}

/** 루틴 순서상 첫 번째 미완료 세트 */
export function findFirstUncheckedSet(
  routine: Routine,
  setChecks: Record<string, boolean[]>
): Pick<WorkoutScrollAnchor, "exerciseId" | "setIndex"> | null {
  for (const ex of sortExercises(routine.exercises)) {
    const checks = setChecks[ex.id] ?? [];
    for (let i = 0; i < ex.sets; i++) {
      if (!checks[i]) {
        return { exerciseId: ex.id, setIndex: i };
      }
    }
  }
  return null;
}

export function hasAnySetChecked(
  setChecks: Record<string, boolean[]>
): boolean {
  return Object.values(setChecks).some((row) => row.some(Boolean));
}

export function workoutDoneElementId(
  exerciseId: string,
  setIndex: number
): string {
  return `done-${exerciseId}-${setIndex}`;
}

/** 완료 체크 라벨 기준 저장용 scrollY (상단 여백 약 72px) */
export function scrollYForDoneAnchor(
  exerciseId: string,
  setIndex: number,
  topInset = 72
): number | null {
  if (typeof window === "undefined") return null;
  const el = document.getElementById(workoutDoneElementId(exerciseId, setIndex));
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return Math.max(0, Math.round(window.scrollY + rect.top - topInset));
}

export function loadWorkoutScrollAnchor(
  routineId: string,
  date: string
): WorkoutScrollAnchor | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(scrollStorageKey(routineId, date));
    if (!raw) return null;
    const data = JSON.parse(raw) as WorkoutScrollAnchor;
    if (
      typeof data?.exerciseId !== "string" ||
      typeof data?.setIndex !== "number" ||
      typeof data?.scrollY !== "number" ||
      !Number.isFinite(data.setIndex) ||
      !Number.isFinite(data.scrollY)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveWorkoutScrollAnchor(
  routineId: string,
  date: string,
  anchor: WorkoutScrollAnchor
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(scrollStorageKey(routineId, date), JSON.stringify(anchor));
  } catch {
    // ignore
  }
}

export function clearWorkoutScrollAnchor(routineId: string, date: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(scrollStorageKey(routineId, date));
  } catch {
    // ignore
  }
}
