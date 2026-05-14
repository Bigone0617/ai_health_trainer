"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEventHandler } from "react";
import { Card } from "@/components/Card";
import {
  clampRestSeconds,
  DEFAULT_REST_SECONDS,
  loadRestSeconds,
  restSecondsBounds,
  saveRestSeconds,
} from "@/lib/restTimerSettings";
import { useNextSet } from "@/providers/nextset-provider";

const PRESET_SECONDS = [60, 90, 120, 180] as const;

export default function SettingsPage() {
  const {
    exportJson,
    importJson,
    resetAllData,
    applyDefaultRoutinesAndSchedule,
  } = useNextSet();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [restDraft, setRestDraft] = useState(String(DEFAULT_REST_SECONDS));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR 기본값 후 클라이언트에서 저장값 반영
    setRestDraft(String(loadRestSeconds()));
  }, []);

  const saveRestPreference = () => {
    const n = Number(restDraft.replace(",", "."));
    const v = clampRestSeconds(n);
    saveRestSeconds(v);
    setRestDraft(String(v));
    setStatus(`쉬는 시간을 ${v}초로 저장했어요.`);
  };

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nextset-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("백업 파일을 내려받았어요.");
  };

  const onPickFile = () => fileRef.current?.click();

  const onFile: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      await importJson(text);
      setStatus("가져오기가 끝났어요. 화면에 반영됐어요.");
    } catch {
      setStatus("가져오기에 실패했어요. JSON 파일을 확인해 주세요.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          데이터 · 백업
        </h1>
        <Link
          href="/"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          홈
        </Link>
      </div>

      <Card id="rest-timer">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          쉬는 시간 (운동 화면 타이머)
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          세트 완료 체크 시 돌아가는 휴식 타이머 길이예요.{" "}
          {restSecondsBounds.min}~{restSecondsBounds.max}초 사이로 맞출 수
          있어요.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          휴식이 끝나면 브라우저 알림을 띄울 수 있어요. 처음 세트 완료를 누를 때
          알림 허용을 물어보면 허용해 주세요. 다른 앱을 보는 중에도 알림이 가려면
          OS·브라우저가 백그라운드 탭을 허용하는 경우가 많고, 일부 환경(특히
          일반 Safari 탭)에서는 제한될 수 있어요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_SECONDS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setRestDraft(String(sec))}
              className={`min-h-[40px] rounded-lg border px-3 text-sm font-semibold ${
                restDraft === String(sec)
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : "border-zinc-200 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {sec}초
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            직접 입력 (초)
            <input
              type="number"
              inputMode="numeric"
              min={restSecondsBounds.min}
              max={restSecondsBounds.max}
              className="min-h-[48px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base dark:border-zinc-700 dark:bg-zinc-950"
              value={restDraft}
              onChange={(e) => setRestDraft(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={saveRestPreference}
            className="min-h-[48px] rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 sm:shrink-0"
          >
            저장
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          기본 루틴 (6개 + 주간 스케줄)
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          앱에 들어 있는 **기본 6개 루틴**은, 저장소에 같은 이름이 없으면
          **자동으로 뒤에 붙습니다**(이미 만든 루틴은 그대로). 기본 루틴을
          **삭제**하면 그 이름은 다시 자동으로 넣지 않아요. 여기서 다시 넣으면
          **지금 저장된 모든 루틴과 주간 스케줄이** 가슴/등/하체 등 6개 기본
          루틴과 월~토 배치로 **교체**되고, 삭제로 막아 둔 이름 목록도
          초기화돼요. 운동 기록·체중·쉬는 시간 설정은 그대로예요.
        </p>
        <button
          type="button"
          className="mt-4 min-h-[48px] w-full rounded-xl border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/70"
          onClick={() => {
            if (
              confirm(
                "저장된 루틴과 주간 스케줄을 앱에 들어 있는 기본 6개 루틴(월~토)으로 바꿀까요? 지금 만든 루틴은 사라져요. (운동 기록·체중은 유지)"
              )
            ) {
              applyDefaultRoutinesAndSchedule();
              setStatus("기본 루틴과 스케줄을 적용했어요. 루틴 탭에서 확인해 주세요.");
            }
          }}
        >
          기본 루틴으로 다시 넣기
        </button>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          보내기 / 가져오기
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          JSON으로 백업하거나 파일에서 복원해요. 가져오기는 루틴·스케줄·운동
          기록·체중 기록을 모두 덮어써요.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onExport}
            className="min-h-[48px] flex-1 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            JSON보내기
          </button>
          <button
            type="button"
            onClick={onPickFile}
            className="min-h-[48px] flex-1 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            JSON 가져오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFile}
          />
        </div>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
          전체 초기화
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          이 브라우저에 저장된 NextSet 데이터를 모두 지워요. 필요하면 먼저
          보내기로 백업하세요.
        </p>
        <button
          type="button"
          className="mt-4 min-h-[48px] w-full rounded-xl border border-red-300 bg-red-50 text-sm font-semibold text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
          onClick={() => {
            if (
              confirm(
                "이 브라우저의 NextSet 데이터를 모두 지울까요? 되돌릴 수 없어요."
              )
            ) {
              resetAllData();
              setStatus("모든 데이터를 지웠어요.");
            }
          }}
        >
          전체 데이터 삭제
        </button>
      </Card>

      {status && (
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {status}
        </p>
      )}
    </div>
  );
}
