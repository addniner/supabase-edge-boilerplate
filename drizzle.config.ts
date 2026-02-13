import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// 환경에 따라 다른 .env 파일 로드
const env = process.env.ENV || "local";
config({ path: `.env.${env}` });

export default defineConfig({
  dialect: "postgresql",
  schema: "./supabase/functions/api/db/schema.ts",
  out: "./supabase/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case",
});
