import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4 sm:max-w-2xl">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
