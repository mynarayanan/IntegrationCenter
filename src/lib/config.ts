const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Integration Centre",
  // Demo mode is deliberately disabled automatically when Supabase is configured,
  // unless explicitly set to true for local-only testing.
  demoMode:
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    (!supabaseConfigured && process.env.NODE_ENV !== "production"),
  supabaseConfigured
};

export function assertProductionConfiguration() {
  if (process.env.NODE_ENV !== "production") return;
  if (appConfig.demoMode) {
    throw new Error("Demo mode must not be enabled in production.");
  }
  if (!appConfig.supabaseConfigured) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required in production."
    );
  }
}
