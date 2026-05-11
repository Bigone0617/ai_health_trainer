"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RoutineEditor } from "@/components/RoutineEditor";
import { useNextSet } from "@/providers/nextset-provider";

export default function EditRoutinePage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { ready, routines } = useNextSet();
  const routine = routines.find((r) => r.id === id);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-zinc-500">
        불러오는 중…
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">루틴을 찾을 수 없어요</h1>
        <Link href="/routines" className="text-emerald-700 hover:underline">
          루틴 목록으로
        </Link>
      </div>
    );
  }

  return <RoutineEditor initialRoutine={routine} />;
}
