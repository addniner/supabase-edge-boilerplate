import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// supabase/functions/.env를 single source로 사용
const env = process.env.ENV || "local";
config({ path: `supabase/functions/.env${env === "local" ? "" : `.${env}`}` });

// Edge Functions는 Docker 내부(host.docker.internal)에서 실행되지만,
// drizzle-kit은 호스트 머신(Node.js)에서 실행되므로 127.0.0.1로 치환
const databaseUrl = process.env.DATABASE_URL!.replace(
  "host.docker.internal",
  "127.0.0.1",
);

export default defineConfig({
  dialect: "postgresql",
  schema: "./supabase/functions/api/infrastructure/db/schema.ts",
  out: "./supabase/migrations",
  dbCredentials: {
    url: databaseUrl,
  },
  casing: "snake_case",
});
