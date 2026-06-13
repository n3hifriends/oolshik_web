// Centralised access to EXPO_PUBLIC_* env vars (inlined by Metro at build time).
export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
  ADMIN_USERNAME: process.env.EXPO_PUBLIC_ADMIN_USERNAME ?? "",
  ADMIN_PASSWORD: process.env.EXPO_PUBLIC_ADMIN_PASSWORD ?? "",
  ADMIN_API_KEY: process.env.EXPO_PUBLIC_ADMIN_API_KEY ?? "",
  // Defaults to false so a missing env var in deployment never silently serves fake data.
  USE_MOCKS: (process.env.EXPO_PUBLIC_USE_MOCKS ?? "false") === "true",
};

if (!ENV.ADMIN_USERNAME || !ENV.ADMIN_PASSWORD)
  console.error("[admin] EXPO_PUBLIC_ADMIN_USERNAME or EXPO_PUBLIC_ADMIN_PASSWORD is not set — login will fail.");
if (!ENV.ADMIN_API_KEY)
  console.error("[admin] EXPO_PUBLIC_ADMIN_API_KEY is not set — API requests will be rejected.");
