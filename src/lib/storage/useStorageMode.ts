"use client";

import type { User } from "@supabase/supabase-js";

export type StorageMode = "loading" | "guest" | "authenticated";

export function getStorageMode(
  authLoading: boolean,
  user: User | null
): StorageMode {
  if (authLoading) return "loading";
  return user ? "authenticated" : "guest";
}
