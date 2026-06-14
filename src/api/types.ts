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
  createdAt: string;
  updatedAt: string;
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
  ref: string;
  createdAt: string;
}

// ---- Reports ----
export interface AdminReportRow {
  id: string;
  reporter: { id: string; displayName: string; phoneNumber: string | null };
  targetType: "USER" | "REQUEST";
  targetId: string;
  reason: string;
  status?: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  reportedAt: string;
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
