// ============================================================
// Admin endpoint functions. Every call goes to the real backend.
// ============================================================
import { apiClient } from "./client";
import type {
  AdminNotificationRow,
  AdminOtpAuditRow,
  AdminPaymentDetail,
  AdminPaymentRow,
  AdminReportDetail,
  AdminReportRow,
  AdminRequestDetail,
  AdminRequestSummary,
  AdminTranscriptionRow,
  AdminUserDetail,
  AdminUserSummary,
  BroadcastDeliveryRow,
  BroadcastDetail,
  BroadcastSummary,
  Page,
  PageParams,
  Role,
  RetryTranscriptionResponse,
  SendBroadcastRequest,
  SendBroadcastResponse,
  StatsResponse,
  TemplateResponse,
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
export interface ReportListParams extends PageParams {
  status?: string;
  reason?: string;
  targetType?: string;
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
  async retryFailedTranscriptions(): Promise<RetryTranscriptionResponse> {
    const { data } = await apiClient.post("/api/admin/transcription-jobs/retry-failed");
    return data;
  },
  async getPayments(
    p: PageParams & { status?: string; mode?: string }
  ): Promise<Page<AdminPaymentRow>> {
    const { data } = await apiClient.get("/api/admin/payments", { params: qp(p) });
    return data;
  },
  async getPaymentDetail(id: string): Promise<AdminPaymentDetail | null> {
    const { data } = await apiClient.get(`/api/admin/payments/${id}`);
    return data;
  },
  async getReports(p: ReportListParams): Promise<Page<AdminReportRow>> {
    const { data } = await apiClient.get("/api/admin/reports", { params: qp(p) });
    return data;
  },
  async getReport(id: string): Promise<AdminReportDetail | null> {
    const { data } = await apiClient.get(`/api/admin/reports/${id}`);
    return data;
  },
  async updateReportStatus(
    id: string,
    body: { status: AdminReportRow["status"]; note?: string }
  ): Promise<AdminReportDetail> {
    const { data } = await apiClient.patch(`/api/admin/reports/${id}/status`, body);
    return data;
  },
  async assignReport(id: string, adminUserId?: string): Promise<AdminReportDetail> {
    const { data } = await apiClient.patch(`/api/admin/reports/${id}/assign`, { adminUserId });
    return data;
  },
  async addReportAction(
    id: string,
    body: { action: string; note?: string }
  ): Promise<AdminReportDetail> {
    const { data } = await apiClient.post(`/api/admin/reports/${id}/actions`, body);
    return data;
  },
  async getNotifications(p: PageParams & { status?: string }): Promise<Page<AdminNotificationRow>> {
    const { data } = await apiClient.get("/api/admin/notifications", { params: qp(p) });
    return data;
  },

  // ---- admin broadcasts ----
  async sendBroadcast(req: SendBroadcastRequest): Promise<SendBroadcastResponse> {
    const { data } = await apiClient.post("/api/admin/notifications/send", req);
    return data;
  },
  async getBroadcasts(p: PageParams): Promise<Page<BroadcastSummary>> {
    const { data } = await apiClient.get("/api/admin/notifications/broadcasts", { params: qp(p) });
    return data;
  },
  async getBroadcast(id: string): Promise<BroadcastDetail> {
    const { data } = await apiClient.get(`/api/admin/notifications/broadcasts/${id}`);
    return data;
  },
  async getBroadcastDeliveries(id: string, p: PageParams): Promise<Page<BroadcastDeliveryRow>> {
    const { data } = await apiClient.get(`/api/admin/notifications/broadcasts/${id}/deliveries`, {
      params: qp(p),
    });
    return data;
  },

  // ---- templates ----
  async getTemplates(): Promise<TemplateResponse[]> {
    const { data } = await apiClient.get("/api/admin/notifications/templates");
    return data;
  },
  async createTemplate(req: { name: string; title: string; body: string }): Promise<TemplateResponse> {
    const { data } = await apiClient.post("/api/admin/notifications/templates", req);
    return data;
  },
  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/notifications/templates/${id}`);
  },
};
