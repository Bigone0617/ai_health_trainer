import { formatLocalDate } from "./dateUtils";
import type { Routine, RoutineExercise, WeeklySchedule, WeightLog } from "./types";

/** 앱이 자동으로 넣는 기본 루틴 이름(순서 = 월~토 스케줄 순). `defaultRoutinesMerge`와 동기화 */
export const BUNDLED_DEFAULT_ROUTINE_NAMES = [
  "가슴 + 어깨 + 삼두",
  "등 + 이두",
  "하체 전면 + 둔근 + 코어",
  "상체 보완",
  "하체 후면 + 둔근 + 코어",
  "전신 가볍게 + 약점 보완",
] as const;

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

/** 샘플 목표 무게는 시작용이며 앱에서 언제든 수정하면 됩니다. */
function ex(
  name: string,
  sets: number,
  targetReps: number,
  targetWeight: number,
  incrementWeight: number,
  order: number
): RoutineExercise {
  return {
    id: newId(),
    name,
    sets,
    targetReps,
    targetWeight,
    incrementWeight,
    order,
  };
}

export function createSampleRoutines(): Routine[] {
  const t = nowIso();
  let o = 0;

  const chestShoulderTri: RoutineExercise[] = [
    ex("벤치프레스 또는 체스트프레스", 4, 10, 45, 2.5, o++),
    ex("인클라인 덤벨프레스", 3, 12, 14, 2.5, o++),
    ex("펙덱플라이", 3, 15, 12, 2.5, o++),
    ex("머신 숄더프레스", 3, 12, 25, 2.5, o++),
    ex("사이드 레터럴 레이즈", 4, 20, 6, 1, o++),
    ex("케이블 푸쉬다운", 3, 15, 18, 2.5, o++),
    ex("오버헤드 케이블 익스텐션", 2, 15, 12, 2.5, o++),
  ];
  o = 0;

  const backBicep: RoutineExercise[] = [
    ex("랫풀다운", 4, 12, 40, 2.5, o++),
    ex("시티드 로우", 4, 12, 35, 2.5, o++),
    ex("원암 덤벨로우", 3, 12, 16, 2.5, o++),
    ex("머신 하이로우", 3, 12, 30, 2.5, o++),
    ex("리어델트 머신", 3, 15, 20, 2.5, o++),
    ex("덤벨컬 또는 바벨컬", 3, 12, 10, 2.5, o++),
    ex("해머컬", 2, 15, 8, 2.5, o++),
  ];
  o = 0;

  const legFrontGluteCore: RoutineExercise[] = [
    ex("레그프레스", 4, 15, 80, 5, o++),
    ex("핵스쿼트 또는 스쿼트", 3, 12, 40, 5, o++),
    ex("불가리안 스플릿스쿼트 (좌우 10회)", 3, 10, 12, 2.5, o++),
    ex("레그익스텐션", 3, 15, 25, 5, o++),
    ex("힙쓰러스트", 4, 12, 50, 5, o++),
    ex("카프레이즈", 4, 20, 35, 5, o++),
    ex("플랭크 (40초 유지)", 3, 40, 0, 0, o++),
  ];
  o = 0;

  const upperAccessory: RoutineExercise[] = [
    ex("인클라인 체스트프레스", 3, 12, 35, 2.5, o++),
    ex("랫풀다운", 3, 12, 38, 2.5, o++),
    ex("머신 로우", 3, 12, 32, 2.5, o++),
    ex("덤벨 숄더프레스", 3, 12, 12, 2.5, o++),
    ex("케이블 플라이", 3, 15, 10, 2.5, o++),
    ex("사이드 레터럴 레이즈", 4, 20, 6, 1, o++),
    ex("페이스풀", 3, 15, 15, 2.5, o++),
    ex("케이블 크런치", 3, 15, 20, 2.5, o++),
  ];
  o = 0;

  const legPosteriorGluteCore: RoutineExercise[] = [
    ex("루마니안 데드리프트", 4, 12, 50, 5, o++),
    ex("레그컬", 4, 15, 30, 5, o++),
    ex("힙쓰러스트", 3, 12, 45, 5, o++),
    ex("백익스텐션", 3, 15, 15, 2.5, o++),
    ex("케이블 킥백 (좌우 15회)", 3, 15, 12, 2.5, o++),
    ex("카프레이즈", 4, 20, 35, 5, o++),
    ex("행잉 니레이즈", 3, 15, 0, 0, o++),
  ];
  o = 0;

  const fullBodyLight: RoutineExercise[] = [
    ex("랫풀다운", 4, 12, 38, 2.5, o++),
    ex("시티드 케이블 로우", 3, 12, 30, 2.5, o++),
    ex("머신 하이로우 또는 원암 머신로우", 3, 12, 28, 2.5, o++),
    ex("스트레이트 암 풀다운", 3, 15, 20, 2.5, o++),
    ex("머신 숄더프레스", 3, 12, 22, 2.5, o++),
    ex("사이드 레터럴 레이즈", 5, 20, 5, 1, o++),
    ex("리어델트 머신 또는 페이스풀", 4, 20, 14, 2.5, o++),
  ];

  return [
    {
      id: newId(),
      name: BUNDLED_DEFAULT_ROUTINE_NAMES[0],
      createdAt: t,
      updatedAt: t,
      exercises: chestShoulderTri,
    },
    {
      id: newId(),
      name: BUNDLED_DEFAULT_ROUTINE_NAMES[1],
      createdAt: t,
      updatedAt: t,
      exercises: backBicep,
    },
    {
      id: newId(),
      name: BUNDLED_DEFAULT_ROUTINE_NAMES[2],
      createdAt: t,
      updatedAt: t,
      exercises: legFrontGluteCore,
    },
    {
      id: newId(),
      name: BUNDLED_DEFAULT_ROUTINE_NAMES[3],
      createdAt: t,
      updatedAt: t,
      exercises: upperAccessory,
    },
    {
      id: newId(),
      name: BUNDLED_DEFAULT_ROUTINE_NAMES[4],
      createdAt: t,
      updatedAt: t,
      exercises: legPosteriorGluteCore,
    },
    {
      id: newId(),
      name: BUNDLED_DEFAULT_ROUTINE_NAMES[5],
      createdAt: t,
      updatedAt: t,
      exercises: fullBodyLight,
    },
  ];
}

/** 월~토에 6개 루틴을 순서대로 배치하고 일요일은 휴식 */
export function createSampleSchedule(routines: Routine[]): WeeklySchedule {
  const [r0, r1, r2, r3, r4, r5] = routines;
  if (!r0 || !r1 || !r2 || !r3 || !r4 || !r5) return {};
  return {
    monday: r0.id,
    tuesday: r1.id,
    wednesday: r2.id,
    thursday: r3.id,
    friday: r4.id,
    saturday: r5.id,
    sunday: null,
  };
}

export function createSampleWeightLog(): WeightLog {
  const t = nowIso();
  const today = formatLocalDate(new Date());
  return {
    id: newId(),
    date: today,
    weight: 78.5,
    createdAt: t,
    updatedAt: t,
  };
}
