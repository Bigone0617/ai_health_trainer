export type RoutineExercise = {
  id: string;
  name: string;
  sets: number;
  targetReps: number;
  targetWeight: number;
  incrementWeight: number;
  order: number;
};

export type Routine = {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
};

export type ScheduleDayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type WeeklySchedule = {
  monday?: string | null;
  tuesday?: string | null;
  wednesday?: string | null;
  thursday?: string | null;
  friday?: string | null;
  saturday?: string | null;
  sunday?: string | null;
};

export type WorkoutSetLog = {
  setNumber: number;
  targetWeight: number;
  targetReps: number;
  actualWeight: number;
  actualReps: number;
};

export type WorkoutExerciseLog = {
  routineExerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  incrementWeight: number;
  successful: boolean;
  nextTargetWeight: number;
  sets: WorkoutSetLog[];
};

export type WorkoutSession = {
  id: string;
  routineId: string;
  routineName: string;
  date: string;
  exercises: WorkoutExerciseLog[];
  completedAt: string;
};

export type WeightLog = {
  id: string;
  date: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
};

export type NextSetExport = {
  version: 1;
  exportedAt: string;
  routines: Routine[];
  weeklySchedule: WeeklySchedule;
  workoutSessions: WorkoutSession[];
  weightLogs: WeightLog[];
};
