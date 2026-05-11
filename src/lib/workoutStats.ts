import type { WorkoutSession } from "./types";

export function workoutSessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce((total, ex) => {
    const exVol = ex.sets.reduce(
      (s, set) => s + set.actualWeight * set.actualReps,
      0
    );
    return total + exVol;
  }, 0);
}
