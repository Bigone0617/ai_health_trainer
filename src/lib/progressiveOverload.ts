import type { WorkoutExerciseLog, WorkoutSetLog } from "./types";

/** 한 종목에 대해 과부하 판정에 필요한 필드. */
export type ProgressiveOverloadInput = Pick<
  WorkoutExerciseLog,
  "targetReps" | "targetWeight" | "incrementWeight" | "sets"
>;

/**
 * 모든 세트가 목표를 충족했는지, 다음 목표 무게, 안내 문구를 반환합니다.
 * 규칙이나 문구를 바꾸려면 이 함수만 수정하면 됩니다.
 */
export function computeProgressiveOverload(
  exercise: ProgressiveOverloadInput
): { successful: boolean; nextTargetWeight: number; reason: string } {
  const { targetReps, targetWeight, incrementWeight, sets } = exercise;

  const allSetsHit = sets.every(
    (s: WorkoutSetLog) =>
      s.actualReps >= targetReps && s.actualWeight >= targetWeight
  );

  if (allSetsHit) {
    return {
      successful: true,
      nextTargetWeight: targetWeight + incrementWeight,
      reason: "모든 세트가 목표 횟수를 달성해 목표 무게가 올랐습니다.",
    };
  }

  return {
    successful: false,
    nextTargetWeight: targetWeight,
    reason:
      "한 세트라도 목표 횟수에 못 미쳐 목표 무게는 그대로 유지됩니다.",
  };
}
