# Oolshik Admin Portal — Mock → Live Data Migration Plan

## Legend
```
[ ] TODO    [x] Done    [~] In progress    [!] Blocked / needs decision
```

---

## Auth Model (read before Phase 1)

The admin portal uses the **existing JWT flow** — no new filter or API key is needed.

```
Login:  POST /api/auth/login  { email, password }  →  { accessToken, refreshToken }
All subsequent requests:  Authorization: Bearer <accessToken>
```

`JwtAuthFilter` already reads `user.getRoleSet()` and maps each role to `ROLE_<name>` authority
(see `JwtAuthFilter.java` lines 30-39). A user with `roles = "ADMIN"` in the DB will have
`ROLE_ADMIN` set in the `SecurityContext` automatically.

**The only backend security change needed is one line in `SecurityConfig`.**

The frontend already stores and sends the JWT via `session.getAccessToken()` and `axios`
interceptors in `client.ts`. No changes to `client.ts` are needed.

---

## Real-time Strategy (V1: Polling)

V1 uses react-query `refetchInterval` — no SSE or WebSocket infrastructure needed.

| Screen | `refetchInterval` | Trigger | Notes |
|---|---|---|---|
| Dashboard / stats | 30 000 ms | timer | Counts change slowly |
| Requests list | 20 000 ms | timer + focus | Status changes during operations |
| Notifications list | 15 000 ms | timer + focus | FAILED entries need quick visibility |
| All other lists | window focus only | — | Default react-query behaviour |

**Implementation**: add `refetchInterval` to specific `useQuery` calls in `useAdmin.ts`.
All lists already use `keepPreviousData` / `placeholderData` — no UI flash on refresh.

**V2 (future)**: Replace polling with `GET /api/admin/events` SSE stream.
Event types: `stats.updated`, `request.status_changed`, `notification.failed`.
React Query cache updates via `queryClient.setQueryData` from incoming events.

---

## Pre-read: Type Conflict Table

Every row is a mismatch between the Claude-generated `types.ts` and the real entity.
Each is resolved in Phase 6.

| `types.ts` field | Entity field | Resolution |
|---|---|---|
| `AdminUserSummary.area` | does not exist | remove from TS |
| `AdminUserSummary.rating` | does not exist | remove from TS |
| `AdminUserSummary.status: "ACTIVE"\|"SUSPENDED"` | does not exist | remove from TS |
| `AdminUserSummary.joinedAt` | `createdAt` | rename in DTO |
| `AdminUserDetail.lastActiveAt` | does not exist | remove from TS |
| `AdminUserDetail.identities` | `FederatedIdentityEntity` (separate table) | Phase 2 / future |
| `AdminOtpAuditRow.phoneNumber` | `maskedPhone` | rename in DTO |
| `AdminOtpAuditRow.purpose` | `action` | rename in DTO |
| `AdminOtpAuditRow.attempts` | does not exist per-row | remove from TS |
| `AdminOtpAuditRow.attemptedAt` | `createdAt` | rename in DTO |
| `AdminTranscriptionRow.id` | `jobId` | rename in DTO |
| `AdminTranscriptionRow.requestId` | `taskId` | rename in DTO |
| `AdminTranscriptionRow.durationSec` | does not exist | remove from TS |
| `AdminTranscriptionRow.transcript` | `transcriptText` | rename in DTO |
| `AdminTranscriptionRow.error` | `lastErrorMessage` | rename in DTO |
| `AdminPaymentRow.requestId` | `taskId` | rename in DTO |
| `AdminPaymentRow.amountInr` | `amountRequested` (BigDecimal) | rename in DTO |
| `AdminPaymentRow.mode` | `paymentMode` (enum) | serialize as `.name()` in DTO |
| `AdminPaymentRow.ref` | `txnRef` | rename in DTO |
| `AdminReportRow.reporter` | `reporterUserId` (UUID) | batch user-ref lookup in service |
| `AdminReportRow.targetType` / `targetId` | derive from which FK is non-null | compute in service |
| `AdminReportRow.status` | does not exist (no review workflow) | remove from TS |
| `AdminReportRow.reportedAt` | `createdAt` | rename in DTO |
| `AdminNotificationRow.channel` | does not exist | remove from TS |
| `AdminNotificationRow.recipient` | does not exist | remove from TS |
| `AdminNotificationRow.maxAttempts` | does not exist | remove from TS |
| `AdminNotificationRow.attempts` | `attemptCount` | rename in DTO |
| `AdminNotificationRow.lastAttemptAt` | ≈ `updatedAt` | map in DTO |
| `StatsResponse.trend` | no pre-built query | native SQL GROUP BY DAY |
| `Page<T>.number` | Spring `pageable.pageNumber` changes across versions | custom `PageResponse<T>` |

---

## Progress Summary

| Phase | Area | Status |
|---|---|---|
| 1 | Backend: Security gate (one line in `SecurityConfig`) | [ ] |
| 2 | Backend: Ensure admin user exists in dev DB | [ ] |
| 3 | Backend: Repository extensions | [ ] |
| 4 | Backend: `AdminDtos.java` | [ ] |
| 5 | Backend: `AdminService.java` | [ ] |
| 6 | Backend: `AdminController.java` | [ ] |
| 7 | Frontend: `types.ts` alignment | [ ] |
| 8 | Frontend: `mock.ts` + `useAdmin.ts` polling + UI field cleanup | [ ] |
| 9 | End-to-end smoke test | [ ] |

---

## Phase 1 — Backend: Security Gate

### 1.1 Add admin path rule to `SecurityConfig.java`

In `filterChain()`, add one `requestMatchers` rule **before** `.anyRequest().authenticated()`:

```java
.authorizeHttpRequests(reg -> reg
    .requestMatchers(
        "/actuator/health/**",
        "/swagger/**", "/v3/api-docs/**",
        "/api/public/**",
        "/api/auth/echo", "/api/auth/otp/**",
        "/api/auth/google", "/api/auth/login", "/api/auth/refresh",
        "/error"
    ).permitAll()
    // ↓ new — ADMIN JWT required for all admin endpoints
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated()
)
```

`JwtAuthFilter` already sets `ROLE_ADMIN` from `user.getRoleSet()` — no new filter is needed.

⚠ `@EnableMethodSecurity` is **not required for this phase** because all admin endpoints
are under a single URL prefix. If service-layer method security is needed later (e.g. to
protect admin mutations called from non-admin paths), add it then.

### 1.2 Rate limit `/api/auth/login`

Even for an internal tool, the login endpoint is internet-facing and must be rate-limited.

Options (pick one):
- **Bucket4j** (in-memory, no infra): add `@RateLimiter` on `AuthController.login()`.
- **Spring Cloud Gateway** throttle filter (if gateway layer exists).
- **nginx `limit_req`** in front of the service.

Recommended default for dev: Bucket4j, 5 requests / 10 s per IP.

---

## Phase 2 — Backend: Admin User in Dev DB

The admin portal login requires a user with `ADMIN` in their `roles` column.

`application-dev.yml` has `app.admin.seed.enabled: true` — check if a seed migration
already creates an admin user (`db/dev-seed`). If not, add one:

```sql
-- db/dev-seed/V9999__admin_user.sql
INSERT INTO app_user (id, phone_number, email, email_verified, password_hash, display_name, roles, preferred_language, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    NULL,
    'admin@oolshik.local',
    true,
    '<bcrypt-hash-of-known-dev-password>',
    'Admin',
    'ADMIN',
    'en-IN',
    now(), now()
) ON CONFLICT (email) DO NOTHING;
```

Record the dev credentials in the backend `.env` (never commit them):
```
ADMIN_EMAIL=admin@oolshik.local
ADMIN_PASSWORD=<dev-only-password>
```

The frontend `.env` must match:
```
EXPO_PUBLIC_ADMIN_EMAIL=admin@oolshik.local
EXPO_PUBLIC_ADMIN_PASSWORD=<dev-only-password>
```

---

## Phase 3 — Backend: Repository Extensions

All additions go on **existing** repository interfaces.

### 3.1 `UserRepository.java`
```java
@Query("""
    SELECT u FROM UserEntity u
    WHERE (:role IS NULL OR u.roles LIKE %:role%)
      AND (:search IS NULL
           OR LOWER(u.displayName) LIKE LOWER(CONCAT('%',:search,'%'))
           OR u.phoneNumber LIKE CONCAT('%',:search,'%')
           OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search,'%')))
    """)
Page<UserEntity> findForAdmin(@Param("role") String role,
                              @Param("search") String search,
                              Pageable pageable);

@Query("SELECT COUNT(u) FROM UserEntity u WHERE u.roles LIKE %:role%")
long countByRolesContaining(@Param("role") String role);
```

### 3.2 `HelpRequestRepository.java`
```java
long countByStatus(HelpRequestStatus status);
long countByStatusIn(Collection<HelpRequestStatus> statuses);
long countByRequesterId(UUID requesterId);
long countByHelperIdAndStatus(UUID helperId, HelpRequestStatus status);

@Query("""
    SELECT h FROM HelpRequestEntity h
    WHERE (:#{#statuses == null} = true OR h.status IN :statuses)
    ORDER BY h.lastStateChangeAt DESC NULLS LAST
    """)
Page<HelpRequestEntity> findForAdmin(@Param("statuses") List<HelpRequestStatus> statuses,
                                     Pageable pageable);

List<HelpRequestEntity> findTop10ByRequesterIdOrderByLastStateChangeAtDesc(UUID requesterId);

// 7-day trend for dashboard chart
@Query(value = """
    SELECT date_trunc('day', last_state_change_at)::date AS day,
           COUNT(*) FILTER (WHERE status <> 'DRAFT') AS created,
           COUNT(*) FILTER (WHERE status = 'COMPLETED')  AS completed
      FROM help_request
     WHERE last_state_change_at >= NOW() - INTERVAL '1 day' * :days
     GROUP BY 1 ORDER BY 1
    """, nativeQuery = true)
List<Object[]> findDailyTrend(@Param("days") int days);
```

### 3.3 `TranscriptionJobRepository.java`
```java
long countByStatus(TranscriptionStatus status);

@Query("""
    SELECT t FROM TranscriptionJobEntity t
    WHERE (:status IS NULL OR t.status = :status)
    ORDER BY t.createdAt DESC
    """)
Page<TranscriptionJobEntity> findForAdmin(@Param("status") TranscriptionStatus status,
                                          Pageable pageable);
```

### 3.4 `PaymentRequestRepository.java`
```java
long countByStatus(String status);

@Query("SELECT COALESCE(SUM(p.amountRequested), 0) FROM PaymentRequest p WHERE p.status = 'PAID_MARKED'")
BigDecimal sumCapturedAmount();

@Query("""
    SELECT p FROM PaymentRequest p
    WHERE (:status IS NULL OR p.status = :status)
      AND (:mode IS NULL OR p.paymentMode = :mode)
    ORDER BY p.createdAt DESC
    """)
Page<PaymentRequest> findForAdmin(@Param("status") String status,
                                  @Param("mode") PaymentMode mode,
                                  Pageable pageable);
```

### 3.5 `OtpAuditLogRepository.java`
```java
@Query("""
    SELECT o FROM OtpAuditLogEntity o
    WHERE (:status IS NULL OR o.status = :status)
    ORDER BY o.createdAt DESC
    """)
Page<OtpAuditLogEntity> findForAdmin(@Param("status") String status, Pageable pageable);

List<OtpAuditLogEntity> findTop20ByMaskedPhoneOrderByCreatedAtDesc(String maskedPhone);
```

### 3.6 `ReportEventRepository.java`
```java
// findAll(Pageable) is inherited from JpaRepository — nothing to add.
```

### 3.7 `NotificationOutboxRepository.java`
```java
long countByStatusIn(Collection<String> statuses);

@Query("""
    SELECT n FROM NotificationOutboxEntity n
    WHERE (:status IS NULL OR n.status = :status)
    ORDER BY n.createdAt DESC
    """)
Page<NotificationOutboxEntity> findForAdmin(@Param("status") String status, Pageable pageable);
```

---

## Phase 4 — Backend: `AdminDtos.java`

Create `src/main/java/com/oolshik/backend/admin/AdminDtos.java`.

### 4.1 `PageResponse<T>` wrapper

```java
// Must NOT use Spring's Page<T> directly — its JSON shape changed in Spring Boot 3.3.
// This wrapper guarantees a stable envelope that matches frontend Page<T> exactly.
public record PageResponse<T>(
    List<T> content,
    int number,           // 0-based page index → matches frontend Page<T>.number
    int size,
    long totalElements,
    int totalPages
) {
    public static <T> PageResponse<T> from(org.springframework.data.domain.Page<T> p) {
        return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(),
                                  p.getTotalElements(), p.getTotalPages());
    }
}
```

### 4.2 Stats
```java
public record StatsResponse(
    long totalUsers, long netas, long karyakartas, long admins,
    long openRequests, long activeRequests, long reviewRequired, long completed,
    long sttFailures, long notificationFailures, long openReports,
    double paymentsCapturedInr,
    List<TrendPoint> trend
) {}

public record TrendPoint(String day, long created, long completed) {}
```

### 4.3 Users
```java
public record AdminUserSummary(
    UUID id, String displayName, String phoneNumber, String email,
    List<String> roles,
    OffsetDateTime joinedAt      // mapped from UserEntity.createdAt
) {}

public record AdminUserDetail(
    UUID id, String displayName, String phoneNumber, String email,
    boolean emailVerified, List<String> roles,
    String languages, String preferredLanguage,
    OffsetDateTime joinedAt, OffsetDateTime updatedAt,
    long requestsMade, long jobsDone
) {}

public record UpdateRolesRequest(List<String> roles) {}
```

### 4.4 Help requests
```java
// Embedded in request summaries and report rows.
public record UserRef(UUID id, String displayName, String phoneNumber) {}

// JTS coordinate order: X = longitude, Y = latitude.
// Always use point.getY() for lat, point.getX() for lng.
public record GeoPoint(double lat, double lng) {}

public record AdminRequestSummary(
    UUID id, String title, String status,
    UserRef requester, @Nullable UserRef helper,
    @Nullable GeoPoint geo,
    OffsetDateTime createdAt
) {}

public record AdminRequestDetail(
    UUID id, String title, String description, String status,
    UserRef requester, @Nullable UserRef helper,
    @Nullable GeoPoint geo, int radiusM,
    @Nullable BigDecimal offerAmount, String offerCurrency,
    OffsetDateTime createdAt
) {}
```

### 4.5 OTP audit
```java
public record AdminOtpAuditRow(
    UUID id, String maskedPhone, String provider,
    String action,       // OtpAuditLogEntity.action (frontend had "purpose")
    String status, String detail,
    OffsetDateTime createdAt
) {}
```

### 4.6 Transcription
```java
public record AdminTranscriptionRow(
    UUID id,             // mapped from jobId
    UUID requestId,      // mapped from taskId
    String status, String engine,
    String languageHint, String detectedLanguage,
    String transcript,   // transcriptText
    BigDecimal confidence,
    int attemptCount,
    String error,        // lastErrorMessage
    OffsetDateTime createdAt, OffsetDateTime updatedAt
) {}
```

### 4.7 Payments
```java
public record AdminPaymentRow(
    UUID id,
    UUID requestId,      // taskId
    String payerRole,    // PaymentPayerRole.name()
    BigDecimal amountInr,// amountRequested
    String mode,         // paymentMode.name()
    String status,
    String ref,          // txnRef
    Instant createdAt
) {}
```

### 4.8 Reports
```java
public record AdminReportRow(
    UUID id,
    UserRef reporter,    // batch-loaded from reporterUserId
    String targetType,   // "USER" if targetUserId non-null, else "REQUEST"
    UUID targetId,       // whichever FK is non-null
    String reason,       // ReportReason.name()
    String details,
    OffsetDateTime reportedAt  // createdAt
) {}
```

### 4.9 Notifications
```java
public record AdminNotificationRow(
    UUID id,
    String event,        // eventType
    UUID aggregateId,
    String status,       // PENDING | PUBLISHED | FAILED | DEAD
    int attempts,        // attemptCount
    String lastError,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt   // proxy for lastAttemptAt
) {}
```

---

## Phase 5 — Backend: `AdminService.java`

Create `src/main/java/com/oolshik/backend/admin/AdminService.java`.

### 5.1 Private helpers

```java
// Roles: "NETA,KARYAKARTA" → ["NETA","KARYAKARTA"]
private List<String> parseRoles(String rolesStr) {
    if (rolesStr == null || rolesStr.isBlank()) return List.of();
    return Arrays.stream(rolesStr.split(","))
        .map(String::trim).filter(s -> !s.isEmpty())
        .collect(Collectors.toList());
}

// PostGIS/JTS: X = longitude, Y = latitude
private GeoPoint toGeo(org.locationtech.jts.geom.Point p) {
    return p == null ? null : new GeoPoint(p.getY(), p.getX());
}

// Batch-load name+phone for a set of user UUIDs
private Map<UUID, UserRef> loadUserRefs(Collection<UUID> ids) {
    return userRepository.findAllById(ids).stream()
        .collect(Collectors.toMap(
            UserEntity::getId,
            u -> new UserRef(u.getId(), u.getDisplayName(), u.getPhoneNumber())
        ));
}
```

### 5.2 `getStats()`

```java
public StatsResponse getStats() {
    long totalUsers  = userRepository.count();
    long netas       = userRepository.countByRolesContaining("NETA");
    long karyakartas = userRepository.countByRolesContaining("KARYAKARTA");
    long admins      = userRepository.countByRolesContaining("ADMIN");

    var activeStatuses = List.of(OPEN, PENDING_AUTH, ASSIGNED, WORK_DONE_PENDING_CONFIRMATION);
    long openRequests   = helpRequestRepository.countByStatus(OPEN);
    long activeRequests = helpRequestRepository.countByStatusIn(activeStatuses);
    long reviewRequired = helpRequestRepository.countByStatus(REVIEW_REQUIRED);
    long completed      = helpRequestRepository.countByStatus(COMPLETED);

    long sttFailures    = transcriptionJobRepository.countByStatus(TranscriptionStatus.FAILED);
    long notifFailures  = notificationOutboxRepository.countByStatusIn(List.of("FAILED", "DEAD"));
    long openReports    = reportEventRepository.count();
    double captured     = paymentRequestRepository.sumCapturedAmount().doubleValue();

    List<TrendPoint> trend = helpRequestRepository.findDailyTrend(7).stream()
        .map(row -> new TrendPoint(
            row[0].toString(),
            ((Number) row[1]).longValue(),
            ((Number) row[2]).longValue()))
        .collect(Collectors.toList());

    return new StatsResponse(totalUsers, netas, karyakartas, admins,
        openRequests, activeRequests, reviewRequired, completed,
        sttFailures, notifFailures, openReports, captured, trend);
}
```

### 5.3 `updateUserRoles()` — with guardrails

```java
// Allowed roles that can be granted via this endpoint
private static final Set<String> ALLOWED_ROLES = Set.of("NETA", "KARYAKARTA", "ADMIN");

@Transactional
public AdminUserDetail updateUserRoles(UUID targetId, List<String> newRoles,
                                        UUID actingAdminId) {
    // 1. Validate role names
    for (String role : newRoles) {
        if (!ALLOWED_ROLES.contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid role: " + role + ". Allowed: " + ALLOWED_ROLES);
        }
    }
    // 2. Disallow empty roles
    if (newRoles.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "User must retain at least one role.");
    }
    // 3. Self-demotion guard: acting admin cannot remove their own ADMIN role
    if (targetId.equals(actingAdminId) && !newRoles.contains("ADMIN")) {
        throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Cannot remove your own ADMIN role.");
    }
    // 4. Last-admin guard: if target currently has ADMIN and new roles don't, ensure another admin exists
    UserEntity target = userRepository.findById(targetId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    boolean wasAdmin = target.getRoleSet().contains(Role.ADMIN);
    boolean willBeAdmin = newRoles.contains("ADMIN");
    if (wasAdmin && !willBeAdmin) {
        long adminCount = userRepository.countByRolesContaining("ADMIN");
        if (adminCount <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cannot remove the last admin.");
        }
    }

    // 5. Persist
    String oldRoles = target.getRoles();
    target.setRoles(String.join(",", newRoles));
    userRepository.save(target);

    // 6. Audit log
    log.info("ADMIN_AUDIT: roles changed for user={} by admin={} from=[{}] to=[{}]",
             targetId, actingAdminId, oldRoles, String.join(",", newRoles));

    return getUser(targetId).orElseThrow();
}
```

`LoggingAspect` already captures all service method calls. The `log.info("ADMIN_AUDIT: ...")` line
produces a dedicated, grep-able audit trail that can be routed to a separate appender in production.

### 5.4 All other service methods

Follow the same pattern as the original plan — map entity → DTO, batch-load user refs for
reports and request summaries. No changes from the original Phase 4 methods.

---

## Phase 6 — Backend: `AdminController.java`

Create `src/main/java/com/oolshik/backend/admin/AdminController.java`.

### 6.1 Enum validation — return 400, not 500

`HelpRequestStatus.valueOf()` and `PaymentMode.valueOf()` throw `IllegalArgumentException` on
unknown strings. Wrap them everywhere they appear:

```java
private HelpRequestStatus parseStatus(String s) {
    if (s == null) return null;
    try { return HelpRequestStatus.valueOf(s); }
    catch (IllegalArgumentException e) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + s);
    }
}

private PaymentMode parseMode(String s) {
    if (s == null) return null;
    try { return PaymentMode.valueOf(s); }
    catch (IllegalArgumentException e) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid mode: " + s);
    }
}

private TranscriptionStatus parseTranscriptionStatus(String s) {
    if (s == null) return null;
    try { return TranscriptionStatus.valueOf(s); }
    catch (IllegalArgumentException e) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid transcription status: " + s);
    }
}
```

Apply the same wrapper pattern to any `List<String>` → `List<HelpRequestStatus>` mapping in
the requests endpoint.

### 6.2 `updateUserRoles` — pass acting admin ID from security context

```java
@PatchMapping("/users/{id}/roles")
public AdminUserDetail updateRoles(
        @PathVariable UUID id,
        @RequestBody UpdateRolesRequest req,
        @AuthenticationPrincipal AuthenticatedUserPrincipal principal) {
    return adminService.updateUserRoles(id, req.roles(), principal.userId());
}
```

### 6.3 Full controller (12 endpoints)

```java
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/stats")
    public StatsResponse getStats() { return adminService.getStats(); }

    @GetMapping("/users")
    public PageResponse<AdminUserSummary> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.getUsers(role, search,
            PageRequest.of(page, size, Sort.by(DESC, "createdAt")));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDetail> getUser(@PathVariable UUID id) {
        return adminService.getUser(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/users/{id}/roles")
    public AdminUserDetail updateRoles(
            @PathVariable UUID id,
            @RequestBody UpdateRolesRequest req,
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal) {
        return adminService.updateUserRoles(id, req.roles(), principal.userId());
    }

    @GetMapping("/users/{id}/requests")
    public List<AdminRequestSummary> getUserRequests(@PathVariable UUID id) {
        return adminService.getUserRequests(id);
    }

    @GetMapping("/users/{id}/otp")
    public List<AdminOtpAuditRow> getUserOtp(@PathVariable UUID id) {
        return adminService.getUserOtp(id);
    }

    @GetMapping("/requests")
    public PageResponse<AdminRequestSummary> listRequests(
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<HelpRequestStatus> parsed = statuses == null ? null :
            statuses.stream().map(this::parseStatus).collect(Collectors.toList());
        return adminService.getRequests(parsed, PageRequest.of(page, size));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<AdminRequestDetail> getRequest(@PathVariable UUID id) {
        return adminService.getRequest(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/otp-audit")
    public PageResponse<AdminOtpAuditRow> listOtpAudit(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.getOtpAudit(status, PageRequest.of(page, size));
    }

    @GetMapping("/transcription-jobs")
    public PageResponse<AdminTranscriptionRow> listTranscriptions(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.getTranscriptions(
            parseTranscriptionStatus(status), PageRequest.of(page, size));
    }

    @GetMapping("/payments")
    public PageResponse<AdminPaymentRow> listPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String mode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.getPayments(status, parseMode(mode), PageRequest.of(page, size));
    }

    @GetMapping("/reports")
    public PageResponse<AdminReportRow> listReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.getReports(PageRequest.of(page, size));
    }

    @GetMapping("/notifications")
    public PageResponse<AdminNotificationRow> listNotifications(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.getNotifications(status, PageRequest.of(page, size));
    }
}
```

---

## Phase 7 — Frontend: `src/api/types.ts` Alignment

Apply the full field rename/removal table from the Pre-read section.
Each interface is rewritten to match the backend DTO exactly.

### 7.1 Changes per type (delta only)

**`AdminUserSummary`** — remove `area`, `rating`, `status`; rename `createdAt` → `joinedAt`
(DTO renames it):
```typescript
export interface AdminUserSummary {
  id: string; displayName: string; phoneNumber: string;
  email: string | null; roles: Role[]; joinedAt: string;
}
```

**`AdminUserDetail`** — remove `lastActiveAt`, `identities`, `area`, `rating`, `status`;
add `emailVerified`, `preferredLanguage`, `languages`, `updatedAt`, `requestsMade`, `jobsDone`:
```typescript
export interface AdminUserDetail {
  id: string; displayName: string; phoneNumber: string;
  email: string | null; emailVerified: boolean; roles: Role[];
  languages: string | null; preferredLanguage: string;
  joinedAt: string; updatedAt: string;
  requestsMade: number; jobsDone: number;
}
```

**`AdminRequestSummary`** — remove `area`, `updatedAt`; make `geo` nullable:
```typescript
export interface AdminRequestSummary {
  id: string; title: string; status: HelpRequestStatus;
  requester: UserRef; helper: UserRef | null;
  geo: GeoPoint | null; createdAt: string;
}
export interface UserRef { id: string; displayName: string; phoneNumber: string; }
```

**`AdminOtpAuditRow`** — rename fields to match entity:
```typescript
export interface AdminOtpAuditRow {
  id: string; maskedPhone: string; provider: string;
  action: string; status: string;
  detail: string | null; createdAt: string;
}
```

**`AdminTranscriptionRow`** — rename to match DTO:
```typescript
export interface AdminTranscriptionRow {
  id: string; requestId: string; status: TranscriptionStatus;
  engine: string | null; languageHint: string | null;
  detectedLanguage: string | null; transcript: string | null;
  confidence: number | null; attemptCount: number;
  error: string | null; createdAt: string; updatedAt: string;
}
```

**`AdminPaymentRow`** — rename to match DTO:
```typescript
export interface AdminPaymentRow {
  id: string; requestId: string;
  payerRole: PaymentPayerRole | null; amountInr: number;
  mode: PaymentMode | null; status: PaymentStatus;
  ref: string | null; createdAt: string;
}
```

**`AdminReportRow`** — remove `status`; align field names:
```typescript
export interface AdminReportRow {
  id: string; reporter: UserRef | null;
  targetType: "USER" | "REQUEST"; targetId: string;
  reason: string; details: string | null; reportedAt: string;
}
```

**`AdminNotificationRow`** — remove `channel`, `recipient`, `maxAttempts`; rename:
```typescript
export interface AdminNotificationRow {
  id: string; event: string; aggregateId: string;
  status: string; attempts: number;
  lastError: string | null; createdAt: string; updatedAt: string;
}
```

---

## Phase 8 — Frontend: Mock, Polling, UI Cleanup

### 8.1 Update `src/api/mock.ts`

Rename all mock generator fields to match the new types from Phase 7.
Key renames: `maskedPhone`, `action`, `languageHint`, `detectedLanguage`,
`confidence`, `attemptCount`, `requestId` (from taskId), `ref` (from txnRef).
Remove: `area`, `rating`, `durationSec`, `channel`, `recipient`, `maxAttempts`.

Run `npm run format` after.

### 8.2 Add polling to `useAdmin.ts`

```typescript
export const useStats = () =>
  useQuery({ queryKey: qk.stats, queryFn: adminApi.getStats,
             refetchInterval: 30_000 });

export const useRequests = (p: RequestListParams) =>
  useQuery({ queryKey: qk.requests(p), queryFn: () => adminApi.getRequests(p),
             placeholderData: keepPreviousData, refetchInterval: 20_000,
             refetchOnWindowFocus: true });

export const useNotifications = (p: PageParams & { status?: string }) =>
  useQuery({ queryKey: qk.notifications(p), queryFn: () => adminApi.getNotifications(p),
             placeholderData: keepPreviousData, refetchInterval: 15_000,
             refetchOnWindowFocus: true });
```

All other list queries: keep `refetchOnWindowFocus: true` (react-query default), no timer.

### 8.3 UI component field cleanup

Search for removed fields and fix each reference:

```bash
grep -r "\.area\b\|\.rating\b\|lastActiveAt\|identities\|durationSec\
|\bchanne\b\|maxAttempts\|\.recipient\b\|\.status.*ACTIVE\|\.status.*SUSPENDED" \
  app/ src/ --include="*.tsx" --include="*.ts"
```

For each hit:
- `area` → remove or display `—`
- `rating` → remove the rating widget
- `lastActiveAt` → remove
- `identities` → remove from user detail panel
- `durationSec` → remove from transcription table column
- `channel`, `recipient`, `maxAttempts` → remove from notifications table

### 8.4 Production mock guard

`src/lib/env.ts` already throws in production when `USE_MOCKS=true`. Also prevent
`mock.ts` from being bundled in production builds by adding a lint rule or tree-shake check.

Simplest enforcement — add to CI build script:
```bash
if grep -r "mockApi" src/api/admin.ts; then
  echo "ERROR: mock imports must not be reachable in production admin.ts"
  exit 1
fi
```

Or conditionally import only when `ENV.USE_MOCKS` is true (current approach — Metro will
not bundle the dead branch in production with `--no-bundle-dev`).

### 8.5 Toggle live data

Update frontend `.env`:
```dotenv
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

Restart `npm run web` — Metro bakes env vars at startup.

---

## Phase 9 — End-to-end Smoke Test

### 9.1 Get a JWT first (all curl commands require this)

```bash
BASE=http://localhost:8080

TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@oolshik.local","password":"<dev-password>"}' \
  | jq -r '.accessToken')

echo "Token: ${TOKEN:0:40}..."  # sanity check — should not be null
```

### 9.2 Backend endpoint checks

```bash
AUTH="Authorization: Bearer $TOKEN"

# Security gate
curl -s $BASE/api/admin/stats | jq .                        # expect 401
curl -s -H "$AUTH" $BASE/api/admin/stats | jq .             # expect stats object

# Each endpoint
curl -s -H "$AUTH" "$BASE/api/admin/users?page=0&size=5"    | jq '.content[0]'
curl -s -H "$AUTH" "$BASE/api/admin/requests?page=0&size=5" | jq '.content[0].geo'
curl -s -H "$AUTH" "$BASE/api/admin/otp-audit?page=0&size=5"| jq '.content[0]'
curl -s -H "$AUTH" "$BASE/api/admin/transcription-jobs"     | jq '.content[0]'
curl -s -H "$AUTH" "$BASE/api/admin/payments"               | jq '.content[0]'
curl -s -H "$AUTH" "$BASE/api/admin/reports"                | jq '.content[0].reporter'
curl -s -H "$AUTH" "$BASE/api/admin/notifications"          | jq '.content[0].status'

# Bad enum → must be 400
curl -s -H "$AUTH" "$BASE/api/admin/requests?statuses=BOGUS" | jq '.status'
curl -s -H "$AUTH" "$BASE/api/admin/payments?mode=CASH"      | jq '.status'

# Role mutation guardrails
# Last admin demotion → expect 409
curl -s -X PATCH -H "$AUTH" -H "Content-Type: application/json" \
  "$BASE/api/admin/users/<own-id>/roles" \
  -d '{"roles":["NETA"]}' | jq .
```

Verify response shapes:
- [ ] `geo` on requests: `{"lat": <number>, "lng": <number>}` — not inverted
- [ ] `roles` on users: array `["ADMIN"]`, not string `"ADMIN"`
- [ ] `page.number` / `page.totalElements` / `page.totalPages` at top level (not under `pageable`)
- [ ] `AdminTranscriptionRow.id` is present (mapped from `jobId`)
- [ ] `AdminNotificationRow.status` is one of `PENDING | PUBLISHED | FAILED | DEAD`
- [ ] Stats `trend` array has 7 entries, each `{ day, created, completed }`

### 9.3 Admin portal smoke test (browser)

With backend on `:8080` and `npm run web` on `:8082`:

- [ ] Login with admin credentials succeeds, redirects to `/dashboard`
- [ ] Dashboard shows live counts and trend chart (not all zeros)
- [ ] Users table: real phone numbers (masked), real roles
- [ ] User detail: `requestsMade` / `jobsDone` match expectations
- [ ] Requests table: real titles, correct statuses; map pin renders at correct coordinates
- [ ] OTP audit: `action` column shows real values (e.g. `SEND`, `VERIFY`)
- [ ] Transcription: `status` values are `PENDING | PROCESSING | COMPLETED | FAILED`
- [ ] Payments: `mode` column shows `MERCHANT_QR | PAY_HELPER_DIRECT | PAY_REQUESTER_DIRECT`
- [ ] Reports: `reporter` shows a name, not a UUID
- [ ] Notifications: `status` shows `PUBLISHED | PENDING | FAILED | DEAD`
- [ ] Role update PATCH persists and both user-detail and users-list queries refresh
- [ ] Dashboard re-fetches every 30 s without page reload (check Network tab)
- [ ] Requests list re-fetches every 20 s

---

## Open Decisions

| Decision | Default |
|---|---|
| `HelpRequestEntity.createdAt` — entity may not have an explicit field | Use `lastStateChangeAt` as proxy; add `@CreationTimestamp createdAt` if needed |
| Rate limiting on `/api/auth/login` | Bucket4j 5 req / 10 s per IP |
| Report review workflow | No `status` in DB now; add a `review_status` column when workflow is designed |
| Notification recipient resolution | Skip for v1; `aggregateId` links to the task |
| User identities (Google/phone) | `FederatedIdentityEntity` join — Phase 2 |
| Production CORS | Add admin portal domain to `app.cors.allowedOrigins` in `application-prod.yml` |
| SSE upgrade (V2) | Event types: `stats.updated`, `request.status_changed`, `notification.failed` |
