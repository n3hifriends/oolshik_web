// ============================================================
// Admin endpoint functions. Every call goes to the real backend.
// ============================================================
import { apiClient } from "./client";
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

// helper to build Spring-style query params
function qp<T extends object>(params: T) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    if (typeof v === "string" && v.toUpperCase() === "ALL") continue;
    out[k] = Array.isArray(v) ? v.join(",") : String(v);
  }
  return out;
}

export interface UserListParams extends PageParams {
  role?: string;
}
export interface RequestListParams extends PageParams {
  statuses?: string[];
  days?: number;
}

export const adminApi = {
  // ---- dashboard ----
  async getStats(): Promise<StatsResponse> {
    const { data } = await apiClient.get("/api/admin/stats");
    return data;
  },

  // ---- users ----
  async getUsers(p: UserListParams): Promise<Page<AdminUserSummary>> {
    const { data } = await apiClient.get("/api/admin/users", { params: qp(p) });
    return data;
  },
  async getUser(id: string): Promise<AdminUserDetail | null> {
    const { data } = await apiClient.get(`/api/admin/users/${id}`);
    return data;
  },
  async updateUserRoles(id: string, roles: Role[]): Promise<AdminUserDetail | null> {
    const { data } = await apiClient.patch(`/api/admin/users/${id}/roles`, { roles });
    return data;
  },
  async getUserRequests(id: string): Promise<AdminRequestSummary[]> {
    const { data } = await apiClient.get(`/api/admin/users/${id}/requests`);
    return data;
  },
  async getUserOtp(id: string, phone: string): Promise<AdminOtpAuditRow[]> {
    const { data } = await apiClient.get(`/api/admin/users/${id}/otp`);
    return data;
  },

  // ---- help requests ----
  async getRequests(p: RequestListParams): Promise<Page<AdminRequestSummary>> {
    const { data } = await apiClient.get("/api/admin/requests", { params: qp(p) });
    return data;
  },
  async getRequest(id: string): Promise<AdminRequestDetail | null> {
    const { data } = await apiClient.get(`/api/admin/requests/${id}`);
    return data;
  },

  // ---- ops ----
  async getOtpAudit(p: PageParams & { status?: string }): Promise<Page<AdminOtpAuditRow>> {
    const { data } = await apiClient.get("/api/admin/otp-audit", { params: qp(p) });
    return data;
  },
  async getTranscription(
    p: PageParams & { status?: string }
  ): Promise<Page<AdminTranscriptionRow>> {
    const { data } = await apiClient.get("/api/admin/transcription-jobs", { params: qp(p) });
    return data;
  },
  async getPayments(
    p: PageParams & { status?: string; mode?: string }
  ): Promise<Page<AdminPaymentRow>> {
    const { data } = await apiClient.get("/api/admin/payments", { params: qp(p) });
    return data;
  },
  async getReports(p: PageParams & { status?: string }): Promise<Page<AdminReportRow>> {
    const { data } = await apiClient.get("/api/admin/reports", { params: qp(p) });
    return data;
  },
  async getNotifications(p: PageParams & { status?: string }): Promise<Page<AdminNotificationRow>> {
    const { data } = await apiClient.get("/api/admin/notifications", { params: qp(p) });
    return data;
  },
};
