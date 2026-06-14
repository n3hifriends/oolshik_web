const PRODUCTION_API_BASE_URL = "https://www.oolshik.in";

// Centralised access to EXPO_PUBLIC_* env vars (inlined by Metro at build time).
export const ENV = {
  API_BASE_URL: PRODUCTION_API_BASE_URL,
  USE_MOCKS: false,
  APP_ENV: process.env.EXPO_PUBLIC_ENV ?? "development",
};
