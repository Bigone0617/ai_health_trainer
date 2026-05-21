import { formatLocalDate, parseLocalDate } from "@/lib/dateUtils";
import type { Routine, WorkoutExerciseLog, WorkoutSession } from "@/lib/types";

const MS_PER_DAY = 86_400_000;

/** 기준일로부터 7일 전 날짜 (YYYY-MM-DD) */
export function dateOneWeekBefore(referenceDate: string): string {
  const d = parseLocalDate(referenceDate);
  d.setDate(d.getDate() - 7);
  return formatLocalDate(d);
}

/**
 * 같은 루틴의 전주(약 7일 전) 운동 기록을 찾습니다.
 * 1) 정확히 7일 전 날짜 2) 그 전후 4~10일 사이 가장 7일에 가까운 기록
 */
export function findLastWeekWorkoutSession(
  sessions: WorkoutSession[],
  routineId: string,
  referenceDate: string
): WorkoutSession | null {
  const targetDate = dateOneWeekBefore(referenceDate);
  const exact = sessions.find(
    (s) => s.routineId === routineId && s.date === targetDate
  );
  if (exact) return exact;

  const refMs = parseLocalDate(referenceDate).getTime();
  let best: WorkoutSession | null = null;
  let bestDiff = Infinity;

  for (const s of sessions) {
    if (s.routineId !== routineId || s.date >= referenceDate) continue;
    const daysAgo = (refMs - parseLocalDate(s.date).getTime()) / MS_PER_DAY;
    if (daysAgo < 4 || daysAgo > 10) continue;
    const diff = Math.abs(daysAgo - 7);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = s;
    }
  }

  return best;
}

function findExerciseLog(
  session: WorkoutSession,
  routineExerciseId: string,
  exerciseName: string
): WorkoutExerciseLog | undefined {
  const byId = session.exercises.find(
    (e) => e.routineExerciseId === routineExerciseId
  );
  if (byId) return byId;
  return session.exercises.find((e) => e.name === exerciseName);
}

export type LastWeekSetValues = { weight: number; reps: number };

/** 종목별 세트 인덱스(0-based) → 지난주 실제 무게·횟수 */
export function buildLastWeekSetsByExercise(
  session: WorkoutSession | null,
  routine: Routine
): Record<string, LastWeekSetValues[]> {
  if (!session) return {};

  const out: Record<string, LastWeekSetValues[]> = {};
  for (const ex of routine.exercises) {
    const log = findExerciseLog(session, ex.id, ex.name);
    if (!log) continue;
    const row: LastWeekSetValues[] = [];
    for (let i = 0; i < ex.sets; i++) {
      const set =
        log.sets.find((s) => s.setNumber === i + 1) ?? log.sets[i];
      if (set) {
        row.push({ weight: set.actualWeight, reps: set.actualReps });
      }
    }
    if (row.length > 0) out[ex.id] = row;
  }
  return out;
}

export function formatLastWeekSetLine(values: LastWeekSetValues): string {
  const w =
    Number.isInteger(values.weight) ? String(values.weight) : String(values.weight);
  const r =
    Number.isInteger(values.reps) ? String(values.reps) : String(values.reps);
  return `${w} kg × ${r}회`;
}
