// CORS 미들웨어

import { cors } from "@hono/cors";

export const corsMiddleware = cors({
  origin: "*",
  allowHeaders: [
    "authorization",
    "x-client-info",
    "apikey",
    "content-type",
    "x-requested-with",
  ],
  allowMethods: ["GET", "POST", "PUT", "OPTIONS", "PATCH", "DELETE"],
  exposeHeaders: ["content-length"],
  maxAge: 86400, // 24시간
  credentials: false,
});
