# RBAC 사용 가이드

이 문서는 RBAC (Role-Based Access Control) 시스템의 사용 방법을 설명합니다.

## 목차
1. [기본 개념](#기본-개념)
2. [권한 체크 방법](#권한-체크-방법)
3. [실제 적용 예제](#실제-적용-예제)
4. [역할 및 권한 관리](#역할-및-권한-관리)
5. [트러블슈팅](#트러블슈팅)

---

## 기본 개념

### 역할 (Roles)
현재 정의된 역할:
- `admin`: 관리자 - 모든 권한
- `user`: 일반 사용자 - 기본 권한 (삭제 제외)

### 권한 (Permissions)
현재 정의된 권한:
- `projects.create`: 프로젝트 생성
- `projects.delete`: 프로젝트 삭제 (admin만)
- `ai.generate`: AI 텍스트 생성
- `images.generate`: 이미지 생성

### 역할-권한 매핑
```typescript
admin: [projects.create, projects.delete, ai.generate, images.generate]
user:  [projects.create, ai.generate, images.generate]
```

---

## 권한 체크 방법

### 방법 1: 미들웨어 사용 (권장)

특정 엔드포인트에 권한 체크 미들웨어를 추가합니다.

```typescript
import { Permission } from "@shared/enums";
import { requirePermission } from "@shared/app";

// 프로젝트 삭제 (admin만 가능)
app.delete("/:projectId",
  requirePermission(Permission.PROJECTS_DELETE),
  async (c: Context) => {
    // 권한이 있는 경우에만 실행됨
    const projectId = c.req.param("projectId");
    await projectService.delete(projectId);
    return Response.ok(c, { message: "Deleted" });
  }
);
```

### 방법 2: Context에서 직접 확인

Service나 Controller 레이어에서 권한을 직접 확인할 수도 있습니다.

```typescript
app.post("/dangerous-action", async (c: Context) => {
  const permissions = c.get("permissions");

  if (!permissions?.includes(Permission.PROJECTS_DELETE)) {
    throw new ForbiddenError("You don't have permission to perform this action");
  }

  // 권한이 있는 경우 계속 진행
  // ...
});
```

### 방법 3: 여러 권한 체크

```typescript
import { requireAnyPermission, requireAllPermissions } from "@shared/app";

// 여러 권한 중 하나라도 있으면 허용
app.post("/upload",
  requireAnyPermission([Permission.IMAGES_GENERATE, Permission.AI_GENERATE]),
  async (c: Context) => {
    // ...
  }
);

// 모든 권한이 필요
app.post("/admin-action",
  requireAllPermissions([Permission.PROJECTS_DELETE, Permission.IMAGES_GENERATE]),
  async (c: Context) => {
    // ...
  }
);
```

---

## 실제 적용 예제

### 예제 1: projects 함수에 적용

```typescript
// supabase/functions/projects/index.ts

import { Context, createHonoApp, Response } from "@shared/app";
import { requirePermission } from "@shared/app";
import { Permission } from "@shared/enums";
import { ProjectGenerationService } from "@services";

const app = createHonoApp().basePath("/projects");
const projectGenerationService = new ProjectGenerationService();

// ✅ 프로젝트 생성: projects.create 권한 필요
app.post("/generation",
  requirePermission(Permission.PROJECTS_CREATE),  // ← 권한 체크 추가
  async (c: Context) => {
    const userId = c.get("userId");
    const body = await c.req.json();
    const validatedData = ProjectGenerationSchema.parse(body);

    const result = await projectGenerationService.generate(userId, validatedData);
    return Response.created(c, result);
  }
);

// ✅ 프로젝트 상세 조회: 권한 체크 없음 (소유권 체크만)
app.get("/:projectId", async (c: Context) => {
  const userId = c.get("userId");
  const projectId = c.req.param("projectId");

  // Service 레이어에서 소유권 검증
  const project = await projectQueryService.getProjectById(projectId, userId);
  return Response.ok(c, project);
});

// ✅ 프로젝트 삭제: projects.delete 권한 필요 (admin만)
app.delete("/:projectId",
  requirePermission(Permission.PROJECTS_DELETE),  // ← admin만 통과
  async (c: Context) => {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");

    await projectService.delete(projectId, userId);
    return Response.ok(c, { message: "Project deleted" });
  }
);
```

### 예제 2: AI 텍스트 생성

```typescript
// AI 텍스트 생성: ai.generate 권한 필요
app.post("/:projectId/ai/text",
  requirePermission(Permission.AI_GENERATE),  // ← 권한 체크
  async (c: Context) => {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const validatedData = ProjectAiTextRequestSchema.parse(body);

    const result = await projectAiTextService.generateText(
      projectId,
      userId,
      validatedData,
    );
    return Response.ok(c, result);
  }
);
```

### 예제 3: images 함수에 적용

```typescript
// supabase/functions/images/index.ts

import { requirePermission } from "@shared/app";
import { Permission } from "@shared/enums";

// 이미지 생성: images.generate 권한 필요
app.post("/generation",
  requirePermission(Permission.IMAGES_GENERATE),  // ← 권한 체크
  async (c: Context) => {
    const userId = c.get("userId");
    const body = await c.req.json();
    // ...
  }
);
```

---

## 역할 및 권한 관리

### 1. 새로운 역할 추가

**Step 1: Enum 업데이트**
```typescript
// supabase/functions/_shared/enums/rbac.ts

export enum Role {
  ADMIN = "admin",
  USER = "user",
  PREMIUM_USER = "premium_user",  // ← 추가
}
```

**Step 2: 권한 매핑 업데이트**
```typescript
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [...],
  [Role.USER]: [...],
  [Role.PREMIUM_USER]: [  // ← 추가
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_DELETE,  // premium은 삭제 가능
    Permission.AI_GENERATE,
    Permission.IMAGES_GENERATE,
  ],
};
```

**Step 3: DB에 권한 데이터 추가**
```sql
-- 새 역할의 권한 추가
INSERT INTO role_permissions (role, permission) VALUES
  ('premium_user', 'projects.create'),
  ('premium_user', 'projects.delete'),
  ('premium_user', 'ai.generate'),
  ('premium_user', 'images.generate');
```

### 2. 새로운 권한 추가

**Step 1: Enum에 권한 추가**
```typescript
export enum Permission {
  PROJECTS_CREATE = "projects.create",
  PROJECTS_DELETE = "projects.delete",
  AI_GENERATE = "ai.generate",
  IMAGES_GENERATE = "images.generate",
  EXPORTS_DOWNLOAD = "exports.download",  // ← 새 권한
}
```

**Step 2: 역할 매핑 업데이트**
```typescript
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_DELETE,
    Permission.AI_GENERATE,
    Permission.IMAGES_GENERATE,
    Permission.EXPORTS_DOWNLOAD,  // ← admin에게 권한 부여
  ],
  [Role.USER]: [
    Permission.PROJECTS_CREATE,
    Permission.AI_GENERATE,
    Permission.IMAGES_GENERATE,
    Permission.EXPORTS_DOWNLOAD,  // ← user에게도 권한 부여
  ],
};
```

**Step 3: DB에 권한 데이터 추가**
```sql
INSERT INTO role_permissions (role, permission) VALUES
  ('admin', 'exports.download'),
  ('user', 'exports.download');
```

**Step 4: 엔드포인트에 적용**
```typescript
app.get("/exports/:id/download",
  requirePermission(Permission.EXPORTS_DOWNLOAD),
  async (c: Context) => {
    // ...
  }
);
```

### 3. 사용자에게 역할 부여

```sql
-- 사용자에게 역할 할당
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

-- 사용자 역할 조회
SELECT u.email, ur.role, ur.created_at, ur.updated_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'user@example.com';

-- 역할별 사용자 수 확인
SELECT role, COUNT(*) as user_count
FROM user_roles
GROUP BY role;
```

---

## 트러블슈팅

### 문제 1: "You don't have permission" 에러

**원인:** 사용자에게 역할이 할당되지 않았거나, 역할에 필요한 권한이 없음

**해결:**
```sql
-- 1. 사용자에게 역할이 있는지 확인
SELECT * FROM user_roles WHERE user_id = 'user-uuid';

-- 2. 없으면 역할 할당
INSERT INTO user_roles (user_id, role) VALUES ('user-uuid', 'user');

-- 3. 역할의 권한 확인
SELECT * FROM role_permissions WHERE role = 'user';
```

### 문제 2: JWT에 user_role이 없음

**원인:** Auth Hook이 제대로 실행되지 않음

**해결:**
```bash
# 1. Auth Hook이 활성화되어 있는지 확인
cat supabase/config.toml | grep -A 2 "auth.hook.custom_access_token"

# 2. DB에서 함수 존재 확인
psql -c "SELECT proname FROM pg_proc WHERE proname = 'custom_access_token_hook';"

# 3. 로그아웃 후 재로그인 (새 토큰 발급)
```

### 문제 3: 권한은 있는데 403 에러

**원인:** Enum과 DB의 권한 문자열 불일치

**해결:**
```typescript
// Enum 확인
console.log(Permission.PROJECTS_CREATE);  // "projects.create"

// DB 확인
SELECT permission FROM role_permissions WHERE role = 'user';
-- 대소문자, 띄어쓰기 확인

// 불일치 시 수정
UPDATE role_permissions
SET permission = 'projects.create'
WHERE permission = 'Projects.Create';  -- 예: 대소문자 틀림
```

### 문제 4: 모든 사용자에게 기본 역할 부여

```sql
-- 기존 사용자 모두에게 'user' 역할 부여
INSERT INTO user_roles (user_id, role)
SELECT id, 'user' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 신규 가입 시 자동 역할 부여 (트리거)
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_default_role();
```

---

## 참고 자료

- **코드 위치**:
  - Enums: `supabase/functions/_shared/enums/rbac.ts`
  - Types: `supabase/functions/_shared/types/rbac.ts`
  - Middleware: `supabase/functions/_shared/app/middleware/auth/rbac.ts`
  - Auth Hook: `supabase/migrations/20251113000002_create_auth_hook.sql`

- **데이터베이스**:
  - 테이블: `user_roles`, `role_permissions`
  - 마이그레이션: `supabase/migrations/20251113000001_create_rbac_tables.sql`
  - Seed: `supabase/seeds/01_rbac_initial_data.sql`

- **Supabase 문서**:
  - Auth Hooks: https://supabase.com/docs/guides/auth/auth-hooks
  - RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
