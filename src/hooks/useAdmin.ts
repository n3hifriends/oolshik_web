// ============================================================
// react-query hooks. Centralised query keys + typed wrappers
// around adminApi. Components consume only these hooks.
// ============================================================
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type RequestListParams, type UserListParams } from "@/api/admin";
import type { PageParams, Role } from "@/api/types";

export const qk = {
  stats: ["stats"] as const,
  users: (p: UserListParams) => ["users", p] as const,
  user: (id: string) => ["user", id] as const,
  userRequests: (id: string) => ["user", id, "requests"] as const,
  userOtp: (id: string) => ["user", id, "otp"] as const,
  requests: (p: RequestListParams) => ["requests", p] as const,
  request: (id: string) => ["request", id] as const,
  otpAudit: (p: PageParams & { status?: string }) => ["otpAudit", p] as const,
  transcription: (p: PageParams & { status?: string }) => ["transcription", p] as const,
  payments: (p: PageParams & { status?: string; mode?: string }) => ["payments", p] as const,
  reports: (p: PageParams & { status?: string }) => ["reports", p] as const,
  notifications: (p: PageParams & { status?: string }) => ["notifications", p] as const,
};

export const useStats = () => useQuery({ queryKey: qk.stats, queryFn: adminApi.getStats });

export const useUsers = (p: UserListParams) =>
  useQuery({
    queryKey: qk.users(p),
    queryFn: () => adminApi.getUsers(p),
    placeholderData: keepPreviousData,
  });

export const useUser = (id: string) =>
  useQuery({ queryKey: qk.user(id), queryFn: () => adminApi.getUser(id), enabled: !!id });

export const useUserRequests = (id: string) =>
  useQuery({
    queryKey: qk.userRequests(id),
    queryFn: () => adminApi.getUserRequests(id),
    enabled: !!id,
  });

export const useUserOtp = (id: string, phone: string) =>
  useQuery({
    queryKey: qk.userOtp(id),
    queryFn: () => adminApi.getUserOtp(id, phone),
    enabled: !!id && !!phone,
  });

export function useUpdateUserRoles(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roles: Role[]) => adminApi.updateUserRoles(id, roles),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.user(id) });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: qk.stats });
    },
  });
}

export const useRequests = (p: RequestListParams) =>
  useQuery({
    queryKey: qk.requests(p),
    queryFn: () => adminApi.getRequests(p),
    placeholderData: keepPreviousData,
  });

export const useRequest = (id: string) =>
  useQuery({ queryKey: qk.request(id), queryFn: () => adminApi.getRequest(id), enabled: !!id });

export const useOtpAudit = (p: PageParams & { status?: string }) =>
  useQuery({
    queryKey: qk.otpAudit(p),
    queryFn: () => adminApi.getOtpAudit(p),
    placeholderData: keepPreviousData,
  });

export const useTranscription = (p: PageParams & { status?: string }) =>
  useQuery({
    queryKey: qk.transcription(p),
    queryFn: () => adminApi.getTranscription(p),
    placeholderData: keepPreviousData,
  });

export const usePayments = (p: PageParams & { status?: string; mode?: string }) =>
  useQuery({
    queryKey: qk.payments(p),
    queryFn: () => adminApi.getPayments(p),
    placeholderData: keepPreviousData,
  });

export const useReports = (p: PageParams & { status?: string }) =>
  useQuery({
    queryKey: qk.reports(p),
    queryFn: () => adminApi.getReports(p),
    placeholderData: keepPreviousData,
  });

export const useNotifications = (p: PageParams & { status?: string }) =>
  useQuery({
    queryKey: qk.notifications(p),
    queryFn: () => adminApi.getNotifications(p),
    placeholderData: keepPreviousData,
  });
