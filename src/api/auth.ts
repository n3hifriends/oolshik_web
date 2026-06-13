import { apiClient } from "./client";
import type { Role } from "./types";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  phone: string | null;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  roles: Role[];
  languages: string | null;
  preferredLanguage: string;
  locale: string;
}

interface RawAuthUser extends Omit<AuthUser, "roles"> {
  roles: string | Role[];
}

function parseRoles(raw: string | Role[]): Role[] {
  if (Array.isArray(raw)) return raw;
  return raw
    .split(",")
    .map((role) => role.trim())
    .filter((role): role is Role => role === "NETA" || role === "KARYAKARTA" || role === "ADMIN");
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/api/auth/login", { email, password });
    return data;
  },
  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<RawAuthUser>("/api/auth/me");
    return { ...data, roles: parseRoles(data.roles) };
  },
};
