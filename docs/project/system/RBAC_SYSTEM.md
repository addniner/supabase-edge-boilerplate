# RBAC (Role-Based Access Control) 시스템

이 프로젝트에 구현된 역할 기반 접근 제어 시스템입니다.

## 📋 개요

JWT 토큰 기반의 유연한 RBAC 시스템으로, Supabase Auth Hook을 활용하여 구현되었습니다.

### 주요 특징
- ✅ **JWT 기반**: Auth Hook이 토큰에 역할 정보 자동 추가
- ✅ **유연한 확장**: TEXT 타입으로 새 역할/권한 쉽게 추가 가능
- ✅ **타입 안전성**: TypeScript enum으로 컴파일 타임 체크
- ✅ **API 레벨 보안**: Edge Function 레벨에서 권한 체크
- ✅ **미들웨어 패턴**: 간단한 데코레이터 방식 적용

---

## 🏗️ 아키텍처

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 로그인                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│             Supabase Auth (JWT 발급)                          │
│                                                               │
│  Auth Hook: custom_access_token_hook()                       │
│  ├─ user_roles 테이블 조회                                    │
│  ├─ JWT claims에 user_role 추가                              │
│  └─ 수정된 JWT 반환                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ JWT with user_role
┌─────────────────────────────────────────────────────────────┐
│                  Edge Function Request                        │
│                                                               │
│  미들웨어 체인:                                                │
│  1. CORS Middleware                                          │
│  2. Request ID Middleware                                    │
│  3. JWT Auth Middleware  ← JWT 검증, userId 추출             │
│  4. RBAC Middleware      ← user_role 추출, permissions 생성   │
│  5. Route Handler        ← requirePermission() 체크          │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름

```
1. 로그인
   └─> Supabase Auth → JWT 발급

2. Auth Hook 실행 (토큰 발급 시)
   └─> user_roles 조회 → JWT에 user_role claim 추가

3. API 요청 (JWT 포함)
   └─> JWT Middleware: 토큰 검증
       └─> RBAC Middleware: user_role 추출 + permissions 생성
           └─> Route Handler: requirePermission() 체크
               └─> 권한 OK → 비즈니스 로직 실행
               └─> 권한 NO → 403 Forbidden
```

---

## 🗄️ 데이터베이스 스키마

### user_roles 테이블
```sql
CREATE TABLE user_roles (
  id         BIGINT PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### role_permissions 테이블
```sql
CREATE TABLE role_permissions (
  id         BIGINT PRIMARY KEY,
  role       TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission)
);
```

### 초기 데이터
```sql
-- Admin: 모든 권한
INSERT INTO role_permissions (role, permission) VALUES
  ('admin', 'projects.create'),
  ('admin', 'projects.delete'),
  ('admin', 'ai.generate'),
  ('admin', 'images.generate');

-- User: 기본 권한 (삭제 제외)
INSERT INTO role_permissions (role, permission) VALUES
  ('user', 'projects.create'),
  ('user', 'ai.generate'),
  ('user', 'images.generate');
```

---

## 💻 코드 구조

### 파일 구성

```
supabase/
├── migrations/
│   ├── 20251113000001_create_rbac_tables.sql      # 테이블 생성
│   └── 20251113000002_create_auth_hook.sql        # Auth Hook 함수
├── seeds/
│   └── 01_rbac_initial_data.sql                   # 초기 역할/권한 데이터
├── functions/
│   └── _shared/
│       ├── enums/
│       │   └── rbac.ts                            # Role, Permission enum
│       ├── types/
│       │   └── rbac.ts                            # RBAC 타입 정의
│       └── app/
│           └── middleware/
│               ├── auth/
│               │   └── rbac.ts                    # RBAC 미들웨어
│               └── appFactory.ts                  # 미들웨어 통합
└── config.toml                                    # Auth Hook 활성화
```

### Enum 정의

```typescript
// supabase/functions/_shared/enums/rbac.ts

export enum Role {
  ADMIN = "admin",
  USER = "user",
}

export enum Permission {
  PROJECTS_CREATE = "projects.create",
  PROJECTS_DELETE = "projects.delete",
  AI_GENERATE = "ai.generate",
  IMAGES_GENERATE = "images.generate",
}
```

### 미들웨어

```typescript
// JWT → RBAC 미들웨어 체인
app.use(authJwtMiddleware);  // userId 설정
app.use(rbacMiddleware);      // userRole, permissions 설정

// 엔드포인트 권한 체크
app.delete("/:id",
  requirePermission(Permission.PROJECTS_DELETE),
  async (c) => {
    // admin만 실행 가능
  }
);
```

---

## 🚀 사용 방법

### 1. 마이그레이션 실행

```bash
# 로컬 환경
supabase db reset

# 또는 개별 실행
supabase migration up
```

### 2. 사용자에게 역할 부여

```sql
-- 특정 사용자를 admin으로 설정
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid', 'admin');

-- 기존 사용자 모두 user로 설정
INSERT INTO user_roles (user_id, role)
SELECT id, 'user' FROM auth.users
ON CONFLICT DO NOTHING;
```

### 3. 엔드포인트에 권한 적용

```typescript
import { requirePermission } from "@shared/app";
import { Permission } from "@shared/enums";

// 권한이 필요한 엔드포인트
app.post("/generation",
  requirePermission(Permission.PROJECTS_CREATE),
  async (c: Context) => {
    // user, admin 모두 접근 가능
  }
);

app.delete("/:id",
  requirePermission(Permission.PROJECTS_DELETE),
  async (c: Context) => {
    // admin만 접근 가능
  }
);
```

---

## 🔧 확장 가이드

### 새 역할 추가

1. **Enum 업데이트**
   ```typescript
   export enum Role {
     ADMIN = "admin",
     USER = "user",
     PREMIUM = "premium",  // 추가
   }
   ```

2. **권한 매핑 업데이트**
   ```typescript
   export const ROLE_PERMISSIONS = {
     [Role.PREMIUM]: [
       Permission.PROJECTS_CREATE,
       Permission.PROJECTS_DELETE,
       Permission.AI_GENERATE,
       Permission.IMAGES_GENERATE,
     ],
   };
   ```

3. **DB에 권한 추가**
   ```sql
   INSERT INTO role_permissions (role, permission) VALUES
     ('premium', 'projects.create'),
     ('premium', 'projects.delete'),
     ('premium', 'ai.generate'),
     ('premium', 'images.generate');
   ```

### 새 권한 추가

1. **Enum에 추가**
   ```typescript
   export enum Permission {
     // ...
     ANALYTICS_VIEW = "analytics.view",  // 추가
   }
   ```

2. **역할 매핑에 추가**
   ```typescript
   [Role.ADMIN]: [
     // ...
     Permission.ANALYTICS_VIEW,
   ]
   ```

3. **DB에 추가**
   ```sql
   INSERT INTO role_permissions (role, permission)
   VALUES ('admin', 'analytics.view');
   ```

4. **엔드포인트에 적용**
   ```typescript
   app.get("/analytics",
     requirePermission(Permission.ANALYTICS_VIEW),
     async (c) => { /* ... */ }
   );
   ```

---

## 🧪 테스트

### 권한 체크 테스트

```typescript
// 1. Admin 사용자로 토큰 획득
const adminToken = await loginAsAdmin();

// 2. DELETE 요청 (성공해야 함)
const response = await fetch("/projects/123", {
  method: "DELETE",
  headers: { Authorization: `Bearer ${adminToken}` },
});
// Expected: 200 OK

// 3. User 사용자로 토큰 획득
const userToken = await loginAsUser();

// 4. DELETE 요청 (실패해야 함)
const response2 = await fetch("/projects/123", {
  method: "DELETE",
  headers: { Authorization: `Bearer ${userToken}` },
});
// Expected: 403 Forbidden
```

---

## 📊 모니터링

### 권한 체크 로그

RBAC 미들웨어는 자동으로 상세한 로그를 남깁니다:

```
INFO: User abc-123 role: admin, permissions: 4
INFO: User abc-123 authorized for projects.delete
WARN: User xyz-456 missing required permission
      requiredPermission: projects.delete
      userPermissions: [projects.create, ai.generate, images.generate]
      userRole: user
```

### 역할/권한 통계 쿼리

```sql
-- 역할별 사용자 수
SELECT role, COUNT(*) as user_count
FROM user_roles
GROUP BY role;

-- 역할별 권한 수
SELECT role, COUNT(*) as permission_count
FROM role_permissions
GROUP BY role;

-- 역할이 없는 사용자
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;
```

---

## ⚠️ 주의사항

### 보안
1. **RLS 정책 유지**: RBAC는 API 레벨 보안이므로, 데이터베이스 RLS 정책은 마지막 방어선으로 유지하세요.
2. **역할 변경 시**: 사용자가 재로그인해야 새 역할이 JWT에 반영됩니다.
3. **권한 체크 누락**: 중요한 엔드포인트에는 반드시 `requirePermission()`을 추가하세요.

### 성능
1. **JWT 캐싱**: 현재는 JWT에서 역할을 읽으므로 DB 조회가 없습니다 (빠름).
2. **권한 매핑**: `ROLE_PERMISSIONS` 객체가 메모리에 로드되어 빠른 조회가 가능합니다.

---

## 📚 관련 문서

- **사용 예제**: [RBAC_USAGE_EXAMPLES.md](./RBAC_USAGE_EXAMPLES.md)
- **Supabase Auth Hooks**: https://supabase.com/docs/guides/auth/auth-hooks
- **프로젝트 가이드**: [CLAUDE.md](./CLAUDE.md)

---

## 🎯 다음 단계

### Option C로 업그레이드 (하이브리드 방식)

현재는 JWT 기반 (Option A)이지만, 실시간 권한 변경이 필요하면 하이브리드 방식으로 전환 가능:

1. JWT에는 역할만 포함 (현재와 동일)
2. 미들웨어에서 필요 시 DB 조회로 최신 권한 확인
3. Redis 캐싱 추가로 성능 유지

**마이그레이션 난이도**: 낮음 (미들웨어만 수정)

---

## 👥 기여

문제가 발생하거나 개선 제안이 있으시면 이슈를 등록해주세요!
