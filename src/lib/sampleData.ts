import { formatLocalDate } from "./dateUtils";
import type { Routine, WeeklySchedule, WeightLog } from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function id(): string {
  return crypto.randomUUID();
}

export function createSampleRoutines(): Routine[] {
  const t = nowIso();
  return [
    {
      id: id(),
      name: "푸시 데이",
      createdAt: t,
      updatedAt: t,
      exercises: [
        {
          id: id(),
          name: "벤치 프레스",
          sets: 3,
          targetReps: 8,
          targetWeight: 60,
          incrementWeight: 2.5,
          order: 0,
        },
        {
          id: id(),
          name: "숄더 프레스",
          sets: 3,
          targetReps: 8,
          targetWeight: 35,
          incrementWeight: 2.5,
          order: 1,
        },
        {
          id: id(),
          name: "케이블 푸시다운",
          sets: 3,
          targetReps: 12,
          targetWeight: 25,
          incrementWeight: 5,
          order: 2,
        },
      ],
    },
    {
      id: id(),
      name: "풀 데이",
      createdAt: t,
      updatedAt: t,
      exercises: [
        {
          id: id(),
          name: "바벨로우",
          sets: 3,
          targetReps: 8,
          targetWeight: 50,
          incrementWeight: 2.5,
          order: 0,
        },
        {
          id: id(),
          name: "랫풀다운",
          sets: 3,
          targetReps: 10,
          targetWeight: 45,
          incrementWeight: 2.5,
          order: 1,
        },
        {
          id: id(),
          name: "페이스 풀",
          sets: 3,
          targetReps: 15,
          targetWeight: 15,
          incrementWeight: 2.5,
          order: 2,
        },
      ],
    },
    {
      id: id(),
      name: "레그 데이",
      createdAt: t,
      updatedAt: t,
      exercises: [
        {
          id: id(),
          name: "스쿼트",
          sets: 3,
          targetReps: 5,
          targetWeight: 80,
          incrementWeight: 5,
          order: 0,
        },
        {
          id: id(),
          name: "루마니안 데드리프트",
          sets: 3,
          targetReps: 8,
          targetWeight: 60,
          incrementWeight: 5,
          order: 1,
        },
        {
          id: id(),
          name: "레그 컬",
          sets: 3,
          targetReps: 12,
          targetWeight: 35,
          incrementWeight: 5,
          order: 2,
        },
      ],
    },
  ];
}

export function createSampleSchedule(routines: Routine[]): WeeklySchedule {
  const [push, pull, leg] = routines;
  if (!push || !pull || !leg) return {};
  return {
    monday: push.id,
    tuesday: pull.id,
    wednesday: leg.id,
    thursday: push.id,
    friday: pull.id,
    saturday: null,
    sunday: null,
  };
}

export function createSampleWeightLog(): WeightLog {
  const t = nowIso();
  const today = formatLocalDate(new Date());
  return {
    id: id(),
    date: today,
    weight: 78.5,
    createdAt: t,
    updatedAt: t,
  };
}
