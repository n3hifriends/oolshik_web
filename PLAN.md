# Oolshik Admin Portal — Production Live Data Plan

## Goal

Replace the generated mock-data admin portal with a production-grade Expo Web admin console backed by real Spring Boot APIs.

The final app must:
- authenticate through backend JWT auth
- require the `ADMIN` role for all admin routes
- load all dashboard and table data from `/api/admin/**`
- keep mock data available only for local UI development
- fail closed if production is accidentally configured to use mocks
- be type-safe, testable, observable, and deployable as a static web app

---

## Non-Negotiables

- No admin username, password, or API key in `EXPO_PUBLIC_*`.
- No static `X-Admin-Key` sent from the browser.
- No generated mock records in production bundles unless explicitly guarded as dev-only.
- No admin route should render real UI until `/api/auth/me` confirms `ADMIN`.
- All admin endpoints must be protected by backend authorization, not frontend checks.
- All list endpoints must use server-side pagination, filtering, and sorting.
- Every DTO consumed by the frontend must be owned as a backend contract and covered by tests.

---

## Current State

Frontend:
- Expo Web app with `expo-router`.
- React Query hooks in `src/hooks/useAdmin.ts`.
- API switch in `src/api/admin.ts` currently supports `EXPO_PUBLIC_USE_MOCKS`.
- Mock data exists in `src/api/mock.ts`.
- JWT auth files exist: `src/api/auth.ts`, `src/api/client.ts`, `src/lib/session.ts`.

Backend:
- Auth endpoints already exist:
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `GET /api/auth/me`
- JWT access tokens authenticate through `JwtAuthFilter`.
- Roles are mapped to Spring authorities as `ROLE_*`.
- Admin API package still needs implementation.

---

## Target Architecture

```text
Browser
  -> POST /api/auth/login
  <- { accessToken, refreshToken }

Browser
  -> GET /api/auth/me with Authorization: Bearer accessToken
  <- user profile with roles including ADMIN

Browser
  -> GET/PATCH /api/admin/** with Authorization: Bearer accessToken
  <- live paginated/admin DTO data

On 401:
  -> POST /api/auth/refresh with refreshToken
  <- { accessToken }
  -> retry original request once
```

Backend security:

```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

---

## Phase 0 — Production Readiness Decisions

- [ ] Confirm admin portal domain, e.g. `admin.oolshik.com`.
- [ ] Add local and production admin origins to backend CORS.
- [ ] Confirm admin seed process:
  - dev: `ADMIN_SEED_ENABLED=true`
  - prod: manually provision first ADMIN or run one-time migration
- [ ] Decide token storage policy:
  - v1: `localStorage` access + refresh tokens
  - stronger future option: backend-set HTTP-only refresh cookie
- [ ] Decide admin audit requirements before enabling mutations:
  - role updates
  - status overrides
  - notification retries
  - report resolution
- [ ] Decide PII visibility and masking rules:
  - phone
  - email
  - OTP audit rows
  - payment references
  - audio URLs/transcripts

---

## Phase 1 — Remove Production Mock Dependency

### 1.1 Frontend Environment Contract

- [ ] Keep only these public env vars:
  ```env
  EXPO_PUBLIC_API_BASE_URL=https://api.oolshik.com
  EXPO_PUBLIC_USE_MOCKS=false
  EXPO_PUBLIC_ENV=production
  ```
- [ ] Remove all public admin credential/API-key env vars:
  - `EXPO_PUBLIC_ADMIN_USERNAME`
  - `EXPO_PUBLIC_ADMIN_PASSWORD`
  - `EXPO_PUBLIC_ADMIN_API_KEY`
- [ ] Add a fail-closed guard:
  - if `EXPO_PUBLIC_ENV=production` and `EXPO_PUBLIC_USE_MOCKS=true`, throw during app startup
  - if `EXPO_PUBLIC_API_BASE_URL` is missing in production, throw during app startup

### 1.2 Mock Isolation

- [ ] Keep `src/api/mock.ts` only for local UI development.
- [ ] Move mock imports behind a dev-only loader so production does not eagerly import mock datasets.
- [ ] Add a visible local-only banner when mocks are enabled.
- [ ] Add a test that production env cannot enable mocks.
- [ ] Add CI check that scans for forbidden production references:
  - `EXPO_PUBLIC_ADMIN_`
  - `X-Admin-Key`
  - `isLoggedIn`
  - hardcoded demo credentials

### 1.3 Acceptance Criteria

- [ ] `EXPO_PUBLIC_USE_MOCKS=false` makes every admin screen call the backend.
- [ ] Production build fails or throws early if mocks are enabled.
- [ ] No frontend admin secrets exist in source, README, plan, or env examples.

---

## Phase 2 — Backend Admin API Contract

Create a backend package:

```text
src/main/java/com/oolshik/backend/admin/
  AdminController.java
  AdminService.java
  AdminDtos.java
```

All endpoints:
- require `ADMIN`
- return DTOs, not entities
- use `Pageable` for lists
- validate filters
- enforce PII masking rules
- avoid lazy-loading surprises by mapping inside service transactions

### 2.1 Endpoint Matrix

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/stats` | Dashboard KPI summary |
| GET | `/api/admin/users` | Paginated users list |
| GET | `/api/admin/users/{id}` | User detail |
| GET | `/api/admin/users/{id}/requests` | User-related help requests |
| GET | `/api/admin/users/{id}/otp` | User OTP audit subset |
| PATCH | `/api/admin/users/{id}/roles` | Role mutation |
| GET | `/api/admin/requests` | Paginated help requests |
| GET | `/api/admin/requests/{id}` | Request detail |
| GET | `/api/admin/otp-audit` | Paginated OTP audit |
| GET | `/api/admin/transcription-jobs` | Paginated transcription jobs |
| GET | `/api/admin/payments` | Paginated payment requests |
| GET | `/api/admin/reports` | Paginated reports |
| GET | `/api/admin/notifications` | Paginated notification outbox |

### 2.2 Query Conventions

Use Spring pageable consistently:

```text
page=0
size=20
sort=createdAt,desc
```

Filters:

```text
search=<text>
status=OPEN
statuses=OPEN,REVIEW_REQUIRED
from=2026-06-01T00:00:00Z
to=2026-06-13T23:59:59Z
role=ADMIN
mode=MERCHANT_QR
```

### 2.3 DTO Rules

- IDs are UUID strings.
- Timestamps are ISO-8601 strings.
- Roles are arrays: `["NETA", "ADMIN"]`.
- Geo is explicit:
  ```ts
  { lat: number; lng: number }
  ```
- Money fields use integer paise or clearly named INR values; do not mix.
- Transcription status must match backend enum:
  - `PENDING`
  - `PROCESSING`
  - `COMPLETED`
  - `FAILED`
- Payment status must match backend status values:
  - `PENDING`
  - `INITIATED`
  - `PAID_MARKED`
  - `DISPUTED`
  - `CANCELLED`

### 2.4 Backend Acceptance Criteria

- [ ] All admin endpoints return `401` with no JWT.
- [ ] All admin endpoints return `403` for non-admin JWT.
- [ ] All admin endpoints return expected DTOs for admin JWT.
- [ ] List endpoints return stable `Page<T>` envelopes.
- [ ] Filters are covered by service/controller tests.
- [ ] Role mutation prevents:
  - self-demotion
  - removing the last ADMIN
  - empty roles
  - invalid role strings

---

## Phase 3 — Frontend Live Data Cutover

### 3.1 API Layer

- [ ] Remove direct component dependency on mock shape assumptions.
- [ ] Keep `src/api/types.ts` synchronized with backend `AdminDtos.java`.
- [ ] Add runtime response validation for admin DTOs, preferably with `zod`.
- [ ] Convert `src/api/admin.ts` to call live APIs by default.
- [ ] Make mock mode an explicit dev-only opt-in.
- [ ] Normalize backend errors into a small frontend error model:
  ```ts
  type ApiError = {
    status: number;
    message: string;
    code?: string;
  };
  ```

### 3.2 Screen Behavior

Each screen must handle:
- loading state
- empty state
- error state with retry
- unauthorized state via global auth handling
- stale data refresh
- pagination boundaries
- filter reset

Screens:

- [ ] Dashboard uses `/api/admin/stats` and recent requests from `/api/admin/requests`.
- [ ] Users list uses `/api/admin/users`.
- [ ] User detail uses `/api/admin/users/{id}`, `/requests`, and `/otp`.
- [ ] Requests list uses `/api/admin/requests`.
- [ ] Request detail uses `/api/admin/requests/{id}`.
- [ ] OTP audit uses `/api/admin/otp-audit`.
- [ ] Transcription uses `/api/admin/transcription-jobs`.
- [ ] Payments uses `/api/admin/payments`.
- [ ] Reports uses `/api/admin/reports`.
- [ ] Notifications uses `/api/admin/notifications`.

### 3.3 React Query Defaults

Recommended defaults:

```ts
staleTime: 15_000
gcTime: 5 * 60_000
retry: (failureCount, error) => failureCount < 2 && !isAuthError(error)
refetchOnWindowFocus: true
```

Polling:
- dashboard: 30 seconds
- notifications: 30 seconds
- transcription: 15 seconds while jobs are `PENDING` or `PROCESSING`
- normal list screens: no polling unless a filter is active or user requests refresh

### 3.4 Frontend Acceptance Criteria

- [ ] With `EXPO_PUBLIC_USE_MOCKS=false`, no mock API function is called.
- [ ] Every screen works against a seeded backend database.
- [ ] Token refresh recovers from expired access tokens.
- [ ] Non-admin users are redirected away from admin routes.
- [ ] All role mutation actions invalidate affected queries.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build:web` passes.

---

## Phase 4 — Real-Time Strategy

Start with production-safe polling. Add push streaming only where polling is too slow or expensive.

### 4.1 V1: Polling

- [ ] Dashboard refetch interval: 30 seconds.
- [ ] Transcription jobs refetch interval: 15 seconds when active jobs exist.
- [ ] Notifications refetch interval: 30 seconds.
- [ ] Manual refresh button on every list/detail view.

### 4.2 V2: Server-Sent Events

Add SSE only after V1 is stable:

```text
GET /api/admin/events
Authorization: Bearer <accessToken>
```

Events:
- `help_request.updated`
- `notification.failed`
- `transcription.completed`
- `transcription.failed`
- `report.created`
- `payment.updated`

Frontend behavior:
- update React Query cache or invalidate narrow query keys
- reconnect with exponential backoff
- fall back to polling

---

## Phase 5 — Security Hardening

Backend:
- [ ] Add `.requestMatchers("/api/admin/**").hasRole("ADMIN")`.
- [ ] Add admin authorization tests.
- [ ] Add rate limiting for `/api/auth/login`.
- [ ] Add audit events for admin mutations.
- [ ] Mask PII based on admin policy.
- [ ] Avoid exposing raw S3 URLs unless signed and short-lived.

Frontend:
- [ ] Remove admin secrets from public env.
- [ ] Fail production startup if mocks are enabled.
- [ ] Clear tokens on refresh failure.
- [ ] Never log tokens, OTPs, or credentials.
- [ ] Add `Content-Security-Policy` at host/CDN level.
- [ ] Use HTTPS-only API base URL in production.

---

## Phase 6 — Testing Strategy

### 6.1 Backend Tests

- [ ] Controller authorization tests.
- [ ] Service mapping tests for each DTO.
- [ ] Repository filter tests.
- [ ] Pagination/sort tests.
- [ ] Role mutation guardrail tests.
- [ ] PII masking tests.

### 6.2 Frontend Tests

- [ ] TypeScript check in pre-commit and CI.
- [ ] API contract fixtures for each DTO.
- [ ] Auth flow tests:
  - login success
  - login failure
  - non-admin denial
  - refresh success
  - refresh failure
- [ ] Screen smoke tests for all admin routes.
- [ ] Build verification with `EXPO_PUBLIC_USE_MOCKS=false`.

### 6.3 End-to-End Smoke Test

Against a seeded dev backend:

1. Login as ADMIN.
2. Dashboard renders real KPI data.
3. Open users list and user detail.
4. Open requests list and request detail map.
5. Open OTP, transcription, payments, reports, notifications.
6. Change a test user's roles and verify audit/guardrails.
7. Expire access token and verify refresh retry.

---

## Phase 7 — Observability

Backend:
- [ ] Log admin endpoint access with admin user ID, route, status, latency.
- [ ] Do not log credentials, JWTs, OTPs, raw phone numbers, or raw transcripts.
- [ ] Add metrics:
  - admin request count by endpoint/status
  - auth failures
  - role mutations
  - notification permanent failures
  - transcription failures

Frontend:
- [ ] Add production error boundary.
- [ ] Show request IDs/correlation IDs when backend returns them.
- [ ] Add client-side error reporting for route-level crashes.

---

## Phase 8 — Deployment

### 8.1 Build

```bash
npm run typecheck
npm run build:web
```

### 8.2 Required Production Env

```env
EXPO_PUBLIC_API_BASE_URL=https://api.oolshik.com
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_ENV=production
```

### 8.3 Static Hosting

Vercel:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

S3 + CloudFront:
- route 403/404 to `/index.html`
- set security headers
- require HTTPS
- invalidate on deploy

### 8.4 Release Checklist

- [ ] Backend admin endpoints deployed.
- [ ] Backend CORS includes admin domain.
- [ ] ADMIN user exists and login works.
- [ ] `EXPO_PUBLIC_USE_MOCKS=false`.
- [ ] Production build passes.
- [ ] Smoke test passes against production-like data.
- [ ] Rollback artifact available.

---

## Phase 9 — Cutover Order

1. Backend security and admin endpoints.
2. Backend tests.
3. Frontend API contract alignment.
4. Disable mocks in local `.env`.
5. Run full frontend against local backend.
6. Run full frontend against staging backend.
7. Add deployment env.
8. Build and deploy static web app.
9. Run production smoke test.
10. Monitor logs and metrics.

---

## Definition Of Done

- [ ] No generated mock data is used in production.
- [ ] No admin secrets are present in public env vars or web bundle.
- [ ] Every admin screen reads from live backend APIs.
- [ ] Backend enforces `ADMIN` authorization for `/api/admin/**`.
- [ ] TypeScript, frontend build, backend tests, and smoke tests pass.
- [ ] Admin mutations have guardrails.
- [ ] Production deployment has CORS, HTTPS, CSP, and rollback.
