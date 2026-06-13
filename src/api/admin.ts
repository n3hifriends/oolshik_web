// ============================================================
// Admin endpoint functions. Each calls the real backend
// (GET/PATCH /api/admin/*) unless EXPO_PUBLIC_USE_MOCKS=true,
// in which case it resolves from ./mock.ts.
//
// Swap to live data by setting EXPO_PUBLIC_USE_MOCKS=false —
// no component changes required.
// ============================================================
import { apiClient } from "./client";
import { ENV } from "@/lib/env";
import { mockApi } from "./mock";
import type {
  AdminNotificationRow,
  AdminOtpAuditRow,
  AdminPaymentRow,
  AdminReportRow,
  AdminRequestDetail,
  AdminRequestSummary,
  AdminTranscriptionRow,
  AdminUserDetail,
  AdminUserSummary,
  Page,
  PageParams,
  Role,
  StatsResponse,
} from "./types";

const USE_MOCKS = ENV.USE_MOCKS;

// helper to build Spring-style query params
function qp<T extends object>(params: T) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = Array.isArray(v) ? v.join(",") : String(v);
  }
  return out;
}

export interface UserListParams extends PageParams {
  role?: string;
  status?: string;
}
export interface RequestListParams extends PageParams {
  statuses?: string[];
  days?: number;
}

export const adminApi = {
  // ---- dashboard ----
  async getStats(): Promise<StatsResponse> {
    if (USE_MOCKS) return mockApi.stats();
    const { data } = await apiClient.get("/api/admin/stats");
    return data;
  },

  // ---- users ----
  async getUsers(p: UserListParams): Promise<Page<AdminUserSummary>> {
    if (USE_MOCKS) return mockApi.users(p);
    const { data } = await apiClient.get("/api/admin/users", { params: qp(p) });
    return data;
  },
  async getUser(id: string): Promise<AdminUserDetail | null> {
    if (USE_MOCKS) return mockApi.user(id);
    const { data } = await apiClient.get(`/api/admin/users/${id}`);
    return data;
  },
  async updateUserRoles(id: string, roles: Role[]): Promise<AdminUserDetail | null> {
    if (USE_MOCKS) return mockApi.updateRoles(id, roles);
    const { data } = await apiClient.patch(`/api/admin/users/${id}/roles`, { roles });
    return data;
  },
  async getUserRequests(id: string): Promise<AdminRequestSummary[]> {
    if (USE_MOCKS) return mockApi.userRequests(id);
    const { data } = await apiClient.get(`/api/admin/users/${id}/requests`);
    return data;
  },
  async getUserOtp(id: string, phone: string): Promise<AdminOtpAuditRow[]> {
    if (USE_MOCKS) return mockApi.userOtp(phone);
    const { data } = await apiClient.get(`/api/admin/users/${id}/otp`);
    return data;
  },

  // ---- help requests ----
  async getRequests(p: RequestListParams): Promise<Page<AdminRequestSummary>> {
    if (USE_MOCKS) return mockApi.requests(p);
    const { data } = await apiClient.get("/api/admin/requests", { params: qp(p) });
    return data;
  },
  async getRequest(id: string): Promise<AdminRequestDetail | null> {
    if (USE_MOCKS) return mockApi.request(id);
    const { data } = await apiClient.get(`/api/admin/requests/${id}`);
    return data;
  },

  // ---- ops ----
  async getOtpAudit(p: PageParams & { status?: string }): Promise<Page<AdminOtpAuditRow>> {
    if (USE_MOCKS) return mockApi.otpAudit(p);
    const { data } = await apiClient.get("/api/admin/otp-audit", { params: qp(p) });
    return data;
  },
  async getTranscription(
    p: PageParams & { status?: string }
  ): Promise<Page<AdminTranscriptionRow>> {
    if (USE_MOCKS) return mockApi.transcription(p);
    const { data } = await apiClient.get("/api/admin/transcription-jobs", { params: qp(p) });
    return data;
  },
  async getPayments(
    p: PageParams & { status?: string; mode?: string }
  ): Promise<Page<AdminPaymentRow>> {
    if (USE_MOCKS) return mockApi.payments(p);
    const { data } = await apiClient.get("/api/admin/payments", { params: qp(p) });
    return data;
  },
  async getReports(p: PageParams & { status?: string }): Promise<Page<AdminReportRow>> {
    if (USE_MOCKS) return mockApi.reports(p);
    const { data } = await apiClient.get("/api/admin/reports", { params: qp(p) });
    return data;
  },
  async getNotifications(p: PageParams & { status?: string }): Promise<Page<AdminNotificationRow>> {
    if (USE_MOCKS) return mockApi.notifications(p);
    const { data } = await apiClient.get("/api/admin/notifications", { params: qp(p) });
    return data;
  },
};
