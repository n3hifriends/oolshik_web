import axios from "axios";
import { ENV } from "@/lib/env";

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  if (ENV.ADMIN_API_KEY) {
    config.headers["X-Admin-Key"] = ENV.ADMIN_API_KEY;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 403) {
      console.warn("[admin] 403 Forbidden — check EXPO_PUBLIC_ADMIN_API_KEY is set correctly.");
    }
    return Promise.reject(error);
  }
);
