import path from "node:path";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

const projectDir = path.resolve(process.cwd());
const isDev = process.env.NODE_ENV !== "production";
// 배포(`next build` / `next start`) 시: `.env` → `.env.production` → (있으면) `.env.local`
// 로컬(`next dev`) 시: `.env` → `.env.development` → `.env.local` … (Next 기본 규칙)
loadEnvConfig(projectDir, isDev);

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
