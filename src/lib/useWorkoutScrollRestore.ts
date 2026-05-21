"use client";

import { useEffect } from "react";
import type { Routine } from "@/lib/types";
import {
  findFirstUncheckedSet,
  loadWorkoutScrollAnchor,
  saveWorkoutScrollAnchor,
  scrollYForDoneAnchor,
  workoutDoneElementId,
} from "@/lib/workoutScrollStorage";

function scrollToY(y: number) {
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
}

function restoreScrollY(y: number) {
  scrollToY(y);
  requestAnimationFrame(() => {
    scrollToY(y);
    requestAnimationFrame(() => scrollToY(y));
  });
  window.setTimeout(() => scrollToY(y), 50);
  window.setTimeout(() => scrollToY(y), 200);
}

function scrollToDoneAnchor(exerciseId: string, setIndex: number, scrollY: number) {
  const el = document.getElementById(workoutDoneElementId(exerciseId, setIndex));
  if (el) {
    el.scrollIntoView({ block: "start", behavior: "instant" });
  }
  restoreScrollY(scrollY);
}

/**
 * 운동 중 첫 미완료 「완료」 버튼 위치를 localStorage에 저장·복원합니다.
 * enabled가 false이면(운동 시작 직후·완료 후) 저장하지 않습니다.
 */
export function useWorkoutScrollRestore(
  routine: Routine | null,
  date: string,
  setChecks: Record<string, boolean[]>,
  enabled: boolean
): void {
  const routineId = routine?.id ?? null;

  useEffect(() => {
    if (!enabled || !routine || !routineId) return;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const persist = () => {
      const anchor = findFirstUncheckedSet(routine, setChecks);
      if (!anchor) return;
      const scrollY = scrollYForDoneAnchor(anchor.exerciseId, anchor.setIndex);
      if (scrollY == null) return;
      saveWorkoutScrollAnchor(routineId, date, { ...anchor, scrollY });
    };

    const restore = () => {
      const saved = loadWorkoutScrollAnchor(routineId, date);
      if (!saved) return;
      const current = findFirstUncheckedSet(routine, setChecks);
      if (
        !current ||
        current.exerciseId !== saved.exerciseId ||
        current.setIndex !== saved.setIndex
      ) {
        return;
      }
      scrollToDoneAnchor(saved.exerciseId, saved.setIndex, saved.scrollY);
    };

    restore();
    persist();

    let scrollDebounce: number | null = null;
    const onScroll = () => {
      if (scrollDebounce != null) window.clearTimeout(scrollDebounce);
      scrollDebounce = window.setTimeout(persist, 120);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        persist();
        return;
      }
      restore();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", persist);
    window.addEventListener("pageshow", restore);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", persist);
      window.removeEventListener("pageshow", restore);
      if (scrollDebounce != null) window.clearTimeout(scrollDebounce);
      persist();
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "auto";
      }
    };
  }, [routine, routineId, date, setChecks, enabled]);
}
