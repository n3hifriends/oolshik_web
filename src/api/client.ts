import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ENV } from "@/lib/env";
import { session } from "@/lib/session";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshResponse {
  accessToken: string;
}

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const token = session.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const refreshToken = session.getRefreshToken();
    const url = original?.url ?? "";

    if (
      status !== 401 ||
      !original ||
      original._retry ||
      !refreshToken ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/login")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      const { data } = await axios.post<RefreshResponse>(
        `${ENV.API_BASE_URL}/api/auth/refresh`,
        { refreshToken },
        { timeout: 15_000 }
      );
      session.setAccessToken(data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      session.clear();
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
      return Promise.reject(refreshError);
    }
  }
);
