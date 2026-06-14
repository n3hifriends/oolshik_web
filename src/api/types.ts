// ============================================================
// API types — mirror the backend admin DTOs (AdminDtos.java)
// ============================================================

export type Role = "NETA" | "KARYAKARTA" | "ADMIN";

export type HelpRequestStatus =
  | "DRAFT"
  | "OPEN"
  | "PENDING_AUTH"
  | "ASSIGNED"
  | "WORK_DONE_PENDING_CONFIRMATION"
  | "REVIEW_REQUIRED"
  | "COMPLETED"
  | "CANCELLED";

export type TranscriptionStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type PaymentPayerRole = "REQUESTER" | "HELPER";
export type PaymentMode = "MERCHANT_QR" | "PAY_HELPER_DIRECT" | "PAY_REQUESTER_DIRECT";
export type PaymentStatus = "PENDING" | "INITIATED" | "PAID_MARKED" | "DISPUTED" | "CANCELLED";

// Spring Data Page<T> envelope
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index (0-based)
  size: number;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string; // e.g. "createdAt,desc"
  search?: string;
}

// ---- Stats ----
export interface StatsResponse {
  totalUsers: number;
  netas: number;
  karyakartas: number;
  admins: number;
  openRequests: number;
  activeRequests: number;
  reviewRequired: number;
  completed: number;
  sttFailures: number;
  notificationFailures: number;
  openReports: number;
  paymentsCapturedInr: number;
  trend: { day: number; created: number; completed: number }[];
}

// ---- Users ----
export interface AdminUserSummary {
  id: string;
  displayName: string;
  phoneNumber: string | null;
  email: string | null;
  roles: Role[];
  area?: string;
  rating?: number;
  status?: "ACTIVE" | "SUSPENDED";
  joinedAt: string; // ISO OffsetDateTime
}

export interface FederatedIdentity {
  provider: "google" | "phone";
  subject: string;
}

export interface AdminUserDetail extends AdminUserSummary {
  emailVerified?: boolean;
  languages?: string | null;
  preferredLanguage?: string;
  updatedAt?: string;
  requestsMade: number;
  jobsDone: number;
  verified?: boolean;
  lastActiveAt?: string;
  identities?: FederatedIdentity[];
}

// ---- Help requests ----
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface AdminRequestSummary {
  id: string;
  title: string;
  status: HelpRequestStatus;
  requester: { id: string; displayName: string; phoneNumber: string | null };
  helper: { id: string; displayName: string; phoneNumber: string | null } | null;
  area?: string;
  geo: GeoPoint | null;
  createdAt: string;
  updatedAt?: string;
}

export interface RequestEvent {
  at: string;
  kind: string;
  label: string;
  by: string;
}

export interface RequestCandidate {
  user: { id: string; displayName: string };
  rating?: number;
  distanceM: number;
  acceptedAt: string | null;
}

export interface AdminRequestDetail extends AdminRequestSummary {
  description: string;
  radiusM: number;
  rewardInr: number;
  requesterRating: number | null;
  helperRating: number | null;
  audioUrl: string | null;
  transcript: string | null;
  events: RequestEvent[];
  candidates: RequestCandidate[];
}

// ---- OTP audit ----
export interface AdminOtpAuditRow {
  id: string;
  maskedPhone: string;
  provider: string;
  action: string;
  status: string;
  detail: string | null;
  createdAt: string;
  phoneNumber?: string | null;
  purpose?: string;
  attempts?: number;
  attemptedAt?: string;
}

// ---- Transcription ----
export interface AdminTranscriptionRow {
  id: string;
  requestId: string;
  // Matches backend TranscriptionStatus.java.
  status: TranscriptionStatus;
  engine: string;
  language: string;
  durationSec: number;
  transcript: string | null;
  error: string | null;
  audioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RetryTranscriptionResponse {
  retried: number;
  totalFailed: number;
}

// ---- Payments ----
export interface AdminPaymentRow {
  id: string;
  requestId: string;
  // Matches backend PaymentPayerRole.java.
  payerRole: PaymentPayerRole;
  amountInr: number;
  // Matches backend PaymentMode.java.
  mode: PaymentMode;
  // Matches backend PaymentRequest.java status column.
  status: PaymentStatus;
  ref: string | null;
  createdAt: string;
}

export interface AdminPaymentUserRef {
  id: string;
  displayName: string;
  phoneNumber: string | null;
}

export interface AdminPaymentDetail {
  id: string;
  taskId: string;
  payerRole: PaymentPayerRole | null;
  mode: PaymentMode | null;
  amountInr: number | null;
  currency: string;
  status: PaymentStatus;
  ref: string | null;
  payeeVpa: string | null;
  payeeName: string | null;
  note: string | null;
  format: string | null;
  payerUser: AdminPaymentUserRef | null;
  requesterUser: AdminPaymentUserRef | null;
  helperUser: AdminPaymentUserRef | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

// ---- Reports ----
export interface AdminReportRow {
  id: string;
  reporter: { id: string; displayName: string; phoneNumber: string | null };
  targetUser: { id: string; displayName: string; phoneNumber: string | null } | null;
  targetType: "USER" | "REQUEST";
  targetId: string;
  reason: string;
  details: string | null;
  status?: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assignedAdmin: { id: string; displayName: string; phoneNumber: string | null } | null;
  targetTitle: string | null;
  targetStatus: string | null;
  reportedAt: string;
  updatedAt: string;
}

export interface AdminReportActionRow {
  id: string;
  admin: { id: string; displayName: string; phoneNumber: string | null } | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
}

export interface AdminReportDetail extends AdminReportRow {
  resolutionNote: string | null;
  resolvedAt: string | null;
  actions: AdminReportActionRow[];
}

// ---- Admin broadcasts ----
export type BroadcastChannel = "PUSH" | "SMS" | "IN_APP";
export type BroadcastStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "PARTIAL_FAILURE";
export type TargetType = "ALL" | "ROLE" | "USER" | "REQUEST";

/**
 * Mobile screen opened when the user taps a push notification from this broadcast.
 * Matches the NotifRoute union in pushNotifications.ts on the mobile side.
 */
export type AdminBroadcastRouteKey = "InAppInbox" | "AdminBroadcast" | "TaskDetail";

export interface SendBroadcastRequest {
  targetType: TargetType;
  targetValue?: string;
  channels: BroadcastChannel[];
  title: string;
  body: string;
  templateId?: string;
  saveAsTemplate?: boolean;
  templateName?: string;
  /** Mobile screen to open on notification tap. Defaults to InAppInbox when omitted. */
  routeKey?: AdminBroadcastRouteKey;
  /** Entity ID required by the chosen route (e.g. task UUID for TaskDetail). */
  routeTargetId?: string;
}

export interface SendBroadcastResponse {
  broadcastId: string;
  status: string;
  estimatedRecipients: number;
}

export interface BroadcastSummary {
  id: string;
  targetType: TargetType;
  targetValue: string | null;
  channels: string;
  status: BroadcastStatus;
  totalRecipients: number;
  pushSent: number;
  pushFailed: number;
  smsSent: number;
  smsFailed: number;
  inAppCreated: number;
  createdAt: string;
  completedAt: string | null;
}

export interface BroadcastDetail extends BroadcastSummary {
  title: string;
  body: string;
  createdBy: string | null;
  processingStartedAt: string | null;
}

export interface BroadcastDeliveryRow {
  id: string;
  userId: string;
  channel: BroadcastChannel;
  status: "SENT" | "FAILED" | "SKIPPED";
  error: string | null;
  sentAt: string;
}

export interface TemplateResponse {
  id: string;
  name: string;
  title: string;
  body: string;
  createdBy: string | null;
  createdAt: string;
}

// ---- Notification outbox ----
export interface AdminNotificationRow {
  id: string;
  event: string;
  aggregateId?: string | null;
  channel?: "PUSH" | "SMS";
  recipient?: { id: string; displayName: string; phoneNumber: string | null };
  status: string;
  attempts: number;
  maxAttempts?: number;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastAttemptAt?: string;
}
