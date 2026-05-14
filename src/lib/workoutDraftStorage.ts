import type { Routine, RoutineExercise } from "./types";

const PREFIX = "nextset:workoutDraft:";
const VERSION = 1 as const;

export type WorkoutDraftSetInput = { actualWeight: string; actualReps: string };

export type WorkoutDraftPayload = {
  v: typeof VERSION;
  inputs: Record<string, WorkoutDraftSetInput[]>;
  setChecks: Record<string, boolean[]>;
};

function sortExercises(exercises: RoutineExercise[]): RoutineExercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}

export function workoutDraftKey(routineId: string, date: string): string {
  return `${PREFIX}${routineId}:${date}`;
}

/** 루틴 구조(종목·세트 수)와 맞을 때만 복원 */
export function loadWorkoutDraft(
  routineId: string,
  date: string,
  routine: Routine
): Pick<WorkoutDraftPayload, "inputs" | "setChecks"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(workoutDraftKey(routineId, date));
    if (!raw) return null;
    const data = JSON.parse(raw) as WorkoutDraftPayload;
    if (data?.v !== VERSION || !data.inputs || !data.setChecks) return null;
    for (const ex of sortExercises(routine.exercises)) {
      const row = data.inputs[ex.id];
      const chk = data.setChecks[ex.id];
      if (!Array.isArray(row) || row.length !== ex.sets) return null;
      if (!Array.isArray(chk) || chk.length !== ex.sets) return null;
      for (const cell of row) {
        if (
          typeof cell?.actualWeight !== "string" ||
          typeof cell?.actualReps !== "string"
        ) {
          return null;
        }
      }
    }
    return { inputs: data.inputs, setChecks: data.setChecks };
  } catch {
    return null;
  }
}

export function saveWorkoutDraft(
  routineId: string,
  date: string,
  payload: Pick<WorkoutDraftPayload, "inputs" | "setChecks">
): void {
  if (typeof window === "undefined") return;
  try {
    const body: WorkoutDraftPayload = {
      v: VERSION,
      inputs: payload.inputs,
      setChecks: payload.setChecks,
    };
    sessionStorage.setItem(workoutDraftKey(routineId, date), JSON.stringify(body));
  } catch {
    // 저장 공간 부족·비공개 모드 등
  }
}

export function clearWorkoutDraft(routineId: string, date: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(workoutDraftKey(routineId, date));
  } catch {
    // ignore
  }
}
