# Oolshik Admin Portal — Expo (web) + expo-router + NativeWind + react-query

A production-shaped admin console for the Oolshik neighbourhood help network. Built as an **Expo web** app (`output: "single"`), it ships with a complete mock data layer so it runs **with zero backend**, then flips to your live Spring Boot API by changing one env flag.

---

## 1. Quick start

```bash
cd oolshik-admin
npm install                 # or: yarn / pnpm install
cp .env.example .env        # then edit values (see below)
npm run web                 # opens http://localhost:8081
```

Login uses the backend admin password endpoint: `POST /api/auth/login`, followed by
`GET /api/auth/me` to require the `ADMIN` role.

Build a static bundle for deploy:

```bash
npm run build:web           # outputs ./dist  (host on any static server / S3 / Nginx)
```

---

## 2. Environment variables

All client env vars are `EXPO_PUBLIC_*` (inlined by Metro at build time). See `.env.example`.

| Var | Purpose |
|-----|---------|
| `EXPO_PUBLIC_API_BASE_URL`   | Spring Boot base URL, e.g. `http://localhost:8080` |
| `EXPO_PUBLIC_USE_MOCKS`      | `true` → run on bundled mock data · `false` → hit the real API |

---

## 3. Going live (mocks → real API)

1. Set `EXPO_PUBLIC_USE_MOCKS=false` and a real `EXPO_PUBLIC_API_BASE_URL`.
2. Seed or create an ADMIN user in the backend with a password hash usable by `POST /api/auth/login`.
3. Implement the endpoints below. **No component changes needed** — every screen consumes `src/hooks/useAdmin.ts`, which calls `src/api/admin.ts`, which already branches on the mock flag.
4. Make sure responses match the DTOs in `src/api/types.ts` (list endpoints return a Spring `Page<T>` envelope: `{ content, totalElements, totalPages, number, size }`).

### Expected endpoints

Auth:

| Method | Path | Returns |
|--------|------|---------|
| POST | `/api/auth/login` | `{ accessToken, refreshToken }` |
| POST | `/api/auth/refresh` | `{ accessToken }` |
| GET | `/api/auth/me` | current user; `roles` must include `ADMIN` |

Admin endpoints use `Authorization: Bearer <accessToken>`.

| Method | Path | Returns |
|--------|------|---------|
| GET   | `/api/admin/stats`                     | `StatsResponse` |
| GET   | `/api/admin/users?page&size&search&role&status` | `Page<AdminUserSummary>` |
| GET   | `/api/admin/users/{id}`                | `AdminUserDetail` |
| PATCH | `/api/admin/users/{id}/roles`          | `{ roles: Role[] }` → `AdminUserDetail` |
| GET   | `/api/admin/users/{id}/requests`       | `AdminRequestSummary[]` |
| GET   | `/api/admin/users/{id}/otp`            | `AdminOtpAuditRow[]` |
| GET   | `/api/admin/requests?page&size&search&statuses&days` | `Page<AdminRequestSummary>` |
| GET   | `/api/admin/requests/{id}`             | `AdminRequestDetail` |
| GET   | `/api/admin/otp-audit?page&size&search&status` | `Page<AdminOtpAuditRow>` |
| GET   | `/api/admin/transcription-jobs?page&size&status` | `Page<AdminTranscriptionRow>` |
| GET   | `/api/admin/payments?page&size&status&mode`    | `Page<AdminPaymentRow>` |
| GET   | `/api/admin/reports?page&size&status`          | `Page<AdminReportRow>` |
| GET   | `/api/admin/notifications?page&size&status`    | `Page<AdminNotificationRow>` |

`statuses` is comma-joined (`OPEN,REVIEW_REQUIRED`). Multi-value params are serialised in `src/api/admin.ts → qp()`.

---

## 4. Project structure

```
oolshik-admin/
├─ app/                          # expo-router routes (file = route)
│  ├─ _layout.tsx                # QueryClientProvider + global.css + Stack
│  ├─ +html.tsx                  # web document shell (injects Leaflet CSS)
│  ├─ index.tsx                  # redirect → /dashboard or /login
│  ├─ (auth)/
│  │  ├─ _layout.tsx
│  │  └─ login.tsx               # backend JWT login + ADMIN role check
│  └─ (admin)/
│     ├─ _layout.tsx             # auth guard + Sidebar + Topbar shell
│     ├─ dashboard.tsx           # stat cards, trend, review queue, recent activity
│     ├─ users/index.tsx         # searchable + paginated table
│     ├─ users/[id].tsx          # profile, federated identities, role mgmt, OTP history
│     ├─ requests/index.tsx      # status-chip + date filters
│     ├─ requests/[id].tsx       # timeline, candidates, audio+transcript, Leaflet map
│     ├─ otp.tsx                 # masked-phone audit log
│     ├─ transcription.tsx       # STT jobs w/ expandable transcript preview
│     ├─ payments.tsx            # transactions + summary cards
│     ├─ reports.tsx             # user/request reports
│     └─ notifications.tsx       # outbox; permanent failures highlighted
├─ src/
│  ├─ api/
│  │  ├─ client.ts               # axios instance + bearer token refresh
│  │  ├─ auth.ts                 # login and current-user API
│  │  ├─ types.ts                # DTOs mirroring the backend
│  │  ├─ admin.ts                # endpoint fns (real ↔ mock switch)
│  │  └─ mock.ts                 # in-memory dataset + Page<T> emulation
│  ├─ hooks/useAdmin.ts          # react-query hooks + query keys
│  ├─ components/                # Sidebar, Topbar, DataTable, StatCard, Icon, ui, RequestMap …
│  ├─ lib/                       # env, session, queryClient, format helpers
│  └─ theme/tokens.ts            # color + status/role metadata (mirrors tailwind.config.js)
├─ global.css                    # Tailwind layers + fonts
├─ tailwind.config.js            # NativeWind preset + Oolshik brand palette
├─ babel.config.js · metro.config.js · app.json · tsconfig.json
└─ .env.example
```

---

## 5. Stack notes

- **expo-router v4** — file-based routing, route groups `(auth)` / `(admin)`, typed routes enabled.
- **NativeWind v4** — Tailwind classes on RN primitives; brand palette in `tailwind.config.js`. Components here lean on `src/theme/tokens.ts` for values that also feed SVG/Leaflet.
- **@tanstack/react-query v5** — all server state; `keepPreviousData` keeps tables stable across pages.
- **@tanstack/react-table** — listed as a dependency if you want headless sorting/column models; the included `DataTable` is a lightweight controlled table you can swap.
- **react-leaflet + leaflet** — request location + service-radius circle (web only; native shows a placeholder). CSS injected via `app/+html.tsx`.
- **axios** — single instance, bearer token attached globally, refresh token retry on 401.

---

## 6. Auth model

`src/lib/session.ts` stores the backend access and refresh JWTs in `localStorage`.
`src/api/client.ts` attaches `Authorization: Bearer …` and retries once via
`/api/auth/refresh` when the backend returns `401`. The admin layout calls
`/api/auth/me` and redirects unless the authenticated user has the `ADMIN` role.
