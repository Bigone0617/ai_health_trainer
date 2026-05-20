"use client";

import { useEffect } from "react";
import {
  loadWorkoutScrollY,
  saveWorkoutScrollY,
} from "@/lib/workoutDraftStorage";

function scrollToY(y: number) {
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
}

/** 레이아웃·자식 렌더 후에도 맞추기 위해 몇 번 재시도 */
function restoreScrollY(y: number) {
  scrollToY(y);
  requestAnimationFrame(() => {
    scrollToY(y);
    requestAnimationFrame(() => scrollToY(y));
  });
  window.setTimeout(() => scrollToY(y), 50);
  window.setTimeout(() => scrollToY(y), 200);
}

/**
 * 오늘 운동 화면 스크롤 위치를 sessionStorage에 저장하고 복원합니다.
 * 다른 앱으로 갔다 오거나 탭이 다시 그려져도 이전 위치로 돌아갑니다.
 */
export function useWorkoutScrollRestore(
  routineId: string | null,
  date: string,
  enabled: boolean
): void {
  useEffect(() => {
    if (!enabled || !routineId) return;

    const id = routineId;
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const persist = () => {
      saveWorkoutScrollY(id, date, window.scrollY);
    };

    const restore = () => {
      const y = loadWorkoutScrollY(id, date);
      if (y != null && y > 0) restoreScrollY(y);
    };

    restore();

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

    const onPageShow = () => restore();

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", persist);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", persist);
      window.removeEventListener("pageshow", onPageShow);
      if (scrollDebounce != null) window.clearTimeout(scrollDebounce);
      persist();
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "auto";
      }
    };
  }, [routineId, date, enabled]);
}
