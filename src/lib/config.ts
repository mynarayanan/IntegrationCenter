const supabaseConfigured = Boolean(
  process.env.VITE_SUPABASE_URL &&
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const appConfig = {
  appName: process.env.VITE_APP_NAME || "Integration Centre",
  // Demo mode is deliberately disabled automatically when Supabase is configured,
  // unless explicitly set to true for local-only testing.
  demoMode:
    process.env.VITE_DEMO_MODE === "true" ||
    (!supabaseConfigured && process.env.NODE_ENV !== "production"),
  supabaseConfigured
};

export function assertProductionConfiguration() {
  if (process.env.NODE_ENV === "production" && appConfig.demoMode) {
    throw new Error("Demo mode must not be enabled in production.");
  }
}
