import { STORAGE_REST_SECONDS } from "./storageKeys";

/** 기본 쉬는 시간(초). 저장값이 없을 때 사용. */
export const DEFAULT_REST_SECONDS = 90;

const MIN_REST_SECONDS = 15;
const MAX_REST_SECONDS = 600;

export function clampRestSeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_REST_SECONDS;
  return Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, Math.round(value)));
}

export function loadRestSeconds(): number {
  if (typeof window === "undefined") return DEFAULT_REST_SECONDS;
  try {
    const raw = localStorage.getItem(STORAGE_REST_SECONDS);
    if (raw === null) return DEFAULT_REST_SECONDS;
    return clampRestSeconds(Number(raw));
  } catch {
    return DEFAULT_REST_SECONDS;
  }
}

export function saveRestSeconds(seconds: number): void {
  const v = clampRestSeconds(seconds);
  localStorage.setItem(STORAGE_REST_SECONDS, String(v));
}

export const restSecondsBounds = {
  min: MIN_REST_SECONDS,
  max: MAX_REST_SECONDS,
} as const;
