/**
 * OpenAPI Docs Route
 *
 * 로컬: Swagger UI 내장 렌더링
 * 원격: petstore.swagger.io로 리다이렉트
 * 프로덕션: routes.ts에서 차단 (WHITE_LISTED_ROUTES에 미포함)
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import type { AppEnv } from "@middleware";

const isLocal = Deno.env.get("ENVIRONMENT") === "local" ||
  !Deno.env.get("ENVIRONMENT");

/** Edge Function 내부 URL은 http://로 들어오므로, 원격에서는 https://로 보정 */
function getOrigin(url: string): string {
  const parsed = new URL(url);
  if (!isLocal) {
    parsed.protocol = "https:";
  }
  return parsed.origin;
}

export function createDocsRoute(
  parentApp: InstanceType<typeof OpenAPIHono<AppEnv>>,
) {
  const docsRoute = new OpenAPIHono();

  // GET /docs - Swagger UI
  if (isLocal) {
    docsRoute.get(
      "/",
      swaggerUI({ url: "/functions/v1/api/docs/openapi.json" }),
    );
  } else {
    docsRoute.get("/", (c) => {
      const origin = getOrigin(c.req.url);
      const specUrl = `${origin}/functions/v1/api/docs/openapi.json`;
      return c.redirect(
        `https://petstore.swagger.io/?url=${encodeURIComponent(specUrl)}`,
      );
    });
  }

  // GET /docs/openapi.json - OAS JSON
  docsRoute.get("/openapi.json", (c) => {
    const origin = getOrigin(c.req.url);
    const doc = parentApp.getOpenAPIDocument({
      openapi: "3.0.0" as const,
      info: {
        title: "Backend API",
        version: "1.0.0",
        description: "Supabase Edge Function Backend API",
      },
      servers: [{ url: `${origin}/functions/v1` }],
    });
    return c.json(doc, 200, {
      "Content-Disposition": "attachment; filename=openapi.json",
    });
  });

  return docsRoute;
}
