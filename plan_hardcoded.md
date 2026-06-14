# Oolshik Admin Portal — Execution Plan

## Legend

```
[ ]  TODO        — not started
[~]  IN PROGRESS — actively being worked on
[x]  DONE        — completed
[!]  BLOCKED     — waiting on a decision or external dependency
```

---

## Quick Progress Summary

| Phase | Title                                     | Status     |
| ----- | ----------------------------------------- | ---------- |
| 0     | Prerequisites                             | `[ ] TODO` |
| 1     | Project Scaffold (Frontend)               | `[ ] TODO` |
| 2     | Auth — Backend JWT Admin Login (Frontend) | `[ ] TODO` |
| 3     | Backend Admin Package (Spring Boot)       | `[ ] TODO` |
| 4     | Frontend Screens                          | `[ ] TODO` |
| 5     | Map Integration                           | `[ ] TODO` |
| 6     | Deployment                                | `[ ] TODO` |

> Update this table as you complete phases. Update individual task checkboxes below as you go.

---

## Reference — Domain Recap

| Entity        | Key states / roles                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Users         | `NETA` (requester), `KARYAKARTA` (helper), `ADMIN`                                                                               |
| Help Requests | `DRAFT → OPEN → PENDING_AUTH → ASSIGNED → WORK_DONE_PENDING_CONFIRMATION → REVIEW_REQUIRED → COMPLETED / CANCELLED`              |
| Auth          | Backend JWT login (`/api/auth/login`) + `/api/auth/me` ADMIN role check; backend calls use `Authorization: Bearer <accessToken>` |
| Infra         | Kafka (STT), AWS S3 (audio), PostGIS (geo on help requests)                                                                      |

## Reference — Tech Stack

| Concern     | Choice                       | Reason                                                                             |
| ----------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| Framework   | Expo SDK 52 + expo-router    | File-based routing, web-first config                                               |
| Styling     | NativeWind (Tailwind for RN) | Utility classes, renders cleanly on web                                            |
| API state   | @tanstack/react-query        | Pagination, caching, refetch on focus                                              |
| Data tables | @tanstack/react-table        | Full-featured, web-native `<table>` output                                         |
| Maps        | react-leaflet                | Only web-compatible map lib, no native modules                                     |
| HTTP        | axios                        | Bearer token interceptor + refresh retry                                           |
| Session     | access + refresh JWTs        | Stored in localStorage for web session persistence; cleared on logout/auth failure |
| Date        | dayjs                        | Lightweight, formats OffsetDateTime from backend                                   |

## Reference — Open Decisions

Resolve these before the affected phase begins:

- `[!]` **Role mutation rules** — define before implementing role change: no self-demotion, no removing last ADMIN, valid role combinations
- `[!]` **Admin action audit** — log role changes, data access mutations (needs new table) — required before production; out of scope for v1 internal tool only
- `[!]` **Admin endpoint tests** — add tests for: unauthenticated → 401, non-admin JWT → 403, ADMIN JWT → 200
- `[!]` **CORS for production domain** — add `admin.oolshik.com` to `APP_CORS_ALLOWED_ORIGINS`
- `[!]` **Geo DTO shape** — confirm how PostGIS `Point` is serialized: `{x, y}` vs `{lat, lng}`
- `[!]` **Pagination response shape** — confirm Spring `Page<T>`: `{ content, totalElements, totalPages, number }`
- `[!]` **PII masking rules** — define which fields are masked in admin responses (phone numbers, emails, etc.)

---

## Phase 0 — Prerequisites

> Must be fully done before writing any code in Phase 1 or Phase 3.

- [ ] **0.1** Seed or create an ADMIN user with a password hash usable by `/api/auth/login`
- [ ] **0.2** Add `.env` to `.gitignore` in both `oolshik_web/` and `oolshik-backend-otp/`
- [ ] **0.3** Add `http://localhost:8081` (Expo web dev) to `APP_CORS_ALLOWED_ORIGINS` in backend config
- [ ] **0.4** Add production admin domain (e.g. `admin.oolshik.com`) to `APP_CORS_ALLOWED_ORIGINS`
- [ ] **0.5** Seed an ADMIN user in the database:
  ```sql
  UPDATE app_user SET roles = 'ADMIN' WHERE phone_number = '+91...';
  -- or set ADMIN_SEED_ENABLED=true in backend config
  ```

---

## Phase 1 — Project Scaffold (Frontend)

### 1.1 — Create Expo App

- [ ] **1.1.1** Run scaffold command:
  ```bash
  npx create-expo-app oolshik_web --template tabs
  cd oolshik_web
  ```
- [ ] **1.1.2** Set `platforms` to web-only in `app.json`:
  ```json
  { "expo": { "platforms": ["web"] } }
  ```
- [ ] **1.1.3** Install all dependencies:
  ```bash
  npx expo install expo-router react-native-web react-dom
  npm install nativewind tailwindcss
  npm install @tanstack/react-query @tanstack/react-table
  npm install react-leaflet leaflet
  npm install axios dayjs
  ```

### 1.2 — Directory Structure

Create the following layout. Tick each item as the file/folder is created:

- [ ] **1.2.1** `app/(auth)/login.tsx`
- [ ] **1.2.2** `app/(admin)/_layout.tsx`
- [ ] **1.2.3** `app/(admin)/index.tsx` (dashboard, route: `/`)
- [ ] **1.2.4** `app/(admin)/users/index.tsx`
- [ ] **1.2.5** `app/(admin)/users/[id].tsx`
- [ ] **1.2.6** `app/(admin)/requests/index.tsx`
- [ ] **1.2.7** `app/(admin)/requests/[id].tsx`
- [ ] **1.2.8** `app/(admin)/otp-audit.tsx`
- [ ] **1.2.9** `app/(admin)/transcription.tsx`
- [ ] **1.2.10** `app/(admin)/payments.tsx`
- [ ] **1.2.11** `app/(admin)/reports.tsx`
- [ ] **1.2.12** `app/(admin)/notifications.tsx`
- [ ] **1.2.13** `src/api/` — axios instance + typed API calls per domain
- [ ] **1.2.14** `src/components/` — `DataTable`, `StatCard`, `StatusBadge`, `SidebarNav`
- [ ] **1.2.15** `src/hooks/` — `useAuth`, `useUsers`, `useHelpRequests`, ...
- [ ] **1.2.16** `src/lib/` — axios config, session helpers

### 1.3 — Environment File

- [ ] **1.3.1** Create `.env` at project root:
  ```
  EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
  EXPO_PUBLIC_USE_MOCKS=false
  ```
- [ ] **1.3.2** Confirm `.env` is listed in `.gitignore`

---

## Phase 2 — Auth: Backend JWT Admin Login (Frontend)

> No admin username, password, or API key is stored in `EXPO_PUBLIC_*` variables.
> The browser sends user-entered credentials to `/api/auth/login`, stores the returned
> JWTs for session persistence, and verifies `ADMIN` via `/api/auth/me`.

### 2.1 — Login Screen (`app/(auth)/login.tsx`)

- [ ] **2.1.1** Render email + password fields and a "Login" button
- [ ] **2.1.2** On submit, call backend login:
  ```ts
  POST /api/auth/login { email, password }
  ```
- [ ] **2.1.3** Store `{ accessToken, refreshToken }` on success
- [ ] **2.1.4** Call `GET /api/auth/me`; if roles do not include `ADMIN`, clear tokens and show an access error
- [ ] **2.1.5** Redirect ADMIN users to `/dashboard`

### 2.2 — Route Guard (`app/(admin)/_layout.tsx`)

- [ ] **2.2.1** On mount, require stored tokens and call `GET /api/auth/me`
- [ ] **2.2.2** If missing/expired/non-admin → clear tokens and `router.replace("/login")`
- [ ] **2.2.3** Render sidebar nav + `<Slot />` for child screens when authenticated

### 2.3 — Logout

- [ ] **2.3.1** Add a Logout button in the sidebar nav
- [ ] **2.3.2** On press — clear access/refresh tokens then `router.replace("/login")`

### 2.4 — Axios Setup (`src/api/client.ts`)

- [ ] **2.4.1** Create axios instance with `baseURL = EXPO_PUBLIC_API_BASE_URL`
- [ ] **2.4.2** Attach bearer access token on every request:
  ```ts
  Authorization: Bearer<accessToken>;
  ```
- [ ] **2.4.3** On `401`, call `/api/auth/refresh` once, update access token, and retry the original request

---

## Phase 3 — Backend Admin Package (Spring Boot)

**Repo:** `/Users/nitinkalokhe/Ni3/spring_boot_proj/oolshik-backend-otp`

> All new files go under `src/main/java/com/oolshik/backend/admin/`.
> Follows the same self-contained package convention as `payment/` and `transcription/`.
> Nothing in existing packages is moved.

### 3.1 — Package Setup

- [ ] **3.1.1** Create directory `src/main/java/com/oolshik/backend/admin/`

### 3.2 — JWT Role Security

- [ ] **3.2.1** Secure `/api/admin/**` with ADMIN role authorization:
  ```java
  .requestMatchers("/api/admin/**").hasRole("ADMIN")
  ```
- [ ] **3.2.2** Ensure `JwtAuthFilter` remains registered before protected admin endpoints are evaluated
- [ ] **3.2.3** Add admin authorization tests for unauthenticated, non-admin, and ADMIN users

### 3.3 — DTOs

- [ ] **3.3.1** Create `admin/AdminDtos.java` with records for:
  - `StatsResponse`
  - `AdminUserSummary`, `AdminUserDetail`
  - `AdminRequestSummary`, `AdminRequestDetail`
  - `AdminOtpAuditRow`
  - `AdminTranscriptionRow`
  - `AdminPaymentRow`
  - `AdminReportRow`
  - `AdminNotificationRow`

### 3.4 — Repository Modifications

Add pageable/search methods to existing repos where missing:

- [ ] **3.4.1** `repo/UserRepository.java` — add `Page<UserEntity> findByDisplayNameContainingOrPhoneNumberContaining(String, String, Pageable)`
- [ ] **3.4.2** `repo/HelpRequestRepository.java` — add `Page<HelpRequestEntity> findByStatusInAndCreatedAtBetween(List<HelpRequestStatus>, OffsetDateTime, OffsetDateTime, Pageable)`
- [ ] **3.4.3** `repo/OtpAuditLogRepository.java` — confirm `findAll(Pageable)` exists (inherited from `JpaRepository`)
- [ ] **3.4.4** `repo/NotificationOutboxRepository.java` — confirm `findAll(Pageable)` exists
- [ ] **3.4.5** `repo/ReportEventRepository.java` — confirm `findAll(Pageable)` exists
- [ ] **3.4.6** `payment/PaymentRequestRepository.java` — confirm `findAll(Pageable)` exists
- [x] **3.4.7** `transcription/TranscriptionJobRepository.java` — `findAll(Pageable)` is **already inherited** from `JpaRepository<TranscriptionJobEntity, UUID>`, no change needed

### 3.5 — AdminService

- [ ] **3.5.1** Create `admin/AdminService.java` — aggregates data from all repos above

### 3.6 — AdminController Endpoints

- [ ] **3.6.1** Create `admin/AdminController.java` with base mapping `/api/admin`
- [ ] **3.6.2** `GET /api/admin/stats` — total users, open requests, REVIEW_REQUIRED count, failed STT jobs, failed notifications
- [ ] **3.6.3** `GET /api/admin/users?page&size&sort&search` — paginated user list
- [ ] **3.6.4** `PATCH /api/admin/users/{id}/roles` — update user roles
- [ ] **3.6.5** `GET /api/admin/requests?page&size&sort&status&from&to` — paginated request list
- [ ] **3.6.6** `GET /api/admin/requests/{id}` — request detail with events + candidates
- [ ] **3.6.7** `GET /api/admin/otp-audit?page&size&sort` — paginated OTP audit log
- [ ] **3.6.8** `GET /api/admin/transcription-jobs?page&size&sort` — paginated transcription jobs
- [ ] **3.6.9** `GET /api/admin/payments?page&size&sort` — paginated payments
- [ ] **3.6.10** `GET /api/admin/reports?page&size&sort` — paginated reports
- [ ] **3.6.11** `GET /api/admin/notifications?page&size&sort` — paginated notification outbox

> All endpoints follow Spring `Pageable` convention: `?page=0&size=20&sort=createdAt,desc`

### 3.7 — Backend Admin Tests

- [ ] **3.7.1** Test admin endpoint with no bearer token → 401
- [ ] **3.7.2** Test admin endpoint with non-admin JWT → 403
- [ ] **3.7.3** Test admin endpoint with ADMIN JWT → 200
- [ ] **3.7.4** Test `PATCH /api/admin/users/{id}/roles` — valid role change succeeds
- [ ] **3.7.5** Test `PATCH /api/admin/users/{id}/roles` — self-demotion returns error (once rule is decided)
- [ ] **3.7.6** Test `PATCH /api/admin/users/{id}/roles` — removing last ADMIN returns error (once rule is decided)

---

## Phase 4 — Frontend Screens

> Depends on Phase 3 endpoints being live. Build one screen at a time.

### 4.1 — Dashboard (`app/(admin)/index.tsx`)

- [ ] **4.1.1** Call `GET /api/admin/stats` via react-query
- [ ] **4.1.2** Render `StatCard` components: total users, active requests, REVIEW_REQUIRED count, STT failures, notification failures

### 4.2 — Users Screen

- [ ] **4.2.1** `users/index.tsx` — searchable + filterable table (display name, phone, email, roles, joined date), server-side pagination
- [ ] **4.2.2** `users/[id].tsx` — full profile detail, federated identities, OTP history, their requests
- [ ] **4.2.3** Role change action — dropdown → `PATCH /api/admin/users/{id}/roles`

### 4.3 — Help Requests Screen

- [ ] **4.3.1** `requests/index.tsx` — filter by status (multi-select) + date range, paginated table (title, requester, helper, status badge, created at, lat/lng)
- [ ] **4.3.2** `requests/[id].tsx` — request detail: title, description, status, radius, event timeline, candidates list, audio + transcript, ratings
- [ ] **4.3.3** Map placeholder (will be filled in Phase 5)

### 4.4 — OTP Audit Screen (`otp-audit.tsx`)

- [ ] **4.4.1** Table: phone (masked), purpose, provider, status, attempted at — paginated

### 4.5 — Transcription Jobs Screen (`transcription.tsx`)

- [ ] **4.5.1** Table: request ID, status, engine, created at, updated at — paginated
- [ ] **4.5.2** Expandable row showing transcript text preview

### 4.6 — Payments Screen (`payments.tsx`)

- [ ] **4.6.1** Table: request ID, payer role, amount, payment mode, status, created at — paginated

### 4.7 — Reports Screen (`reports.tsx`)

- [ ] **4.7.1** Table: reporter, reported user/request, reason, reported at — paginated

### 4.8 — Notifications Outbox Screen (`notifications.tsx`)

- [ ] **4.8.1** Table: event type, status, attempts / 8, last attempted at — paginated
- [ ] **4.8.2** Highlight rows where `attempts >= maxAttempts` (permanent failure)

---

## Phase 5 — Map Integration

- [ ] **5.1** Confirm geo DTO shape from `AdminDtos.java` (resolve open decision `[!]` above)
- [ ] **5.2** Add react-leaflet map to `requests/[id].tsx`:

  ```tsx
  import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";

  <MapContainer center={[lat, lng]} zoom={14} style={{ height: 300 }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Marker position={[lat, lng]} />
    <Circle center={[lat, lng]} radius={radiusMeters} />
  </MapContainer>;
  ```

  Uses OpenStreetMap tiles — no API key required.

- [ ] **5.3** Test map renders correctly in browser with a real request that has geo coordinates

---

## Phase 6 — Deployment

### 6.1 — Build

- [ ] **6.1.1** Run web export:
  ```bash
  npx expo export --platform web   # outputs to /dist
  ```

### 6.2 — SPA Routing Rewrites

> Required — without this, any direct URL (e.g. `/users/123`) returns 404.

- [ ] **6.2.1** **Vercel** — create `vercel.json` at project root:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- [ ] **6.2.2** **S3 + CloudFront** — set error page for 403/404 → `/index.html` with HTTP 200; set S3 error document to `index.html`

### 6.3 — Deploy

Choose one option:

- [ ] **6.3.1** **Option A — Vercel:**

  ```bash
  npm install -g vercel
  vercel --prod
  ```

  Set `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_USE_MOCKS=false` as Vercel environment variables.

- [ ] **6.3.2** **Option B — S3 + CloudFront:**
  ```bash
  aws s3 sync dist/ s3://oolshik-admin-bucket --delete
  aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
  ```
  Set env vars at build time before running `expo export`.

---

## Out of Scope (v1 — internal tool only)

- Real-time updates (WebSocket / SSE) — react-query `refetchInterval` is sufficient
- Dark mode
- Mobile/tablet native build — web-only target
- Admin action audit log — out of scope for v1 **internal** tool; **required before any public/production deployment** (see Open Decisions)
