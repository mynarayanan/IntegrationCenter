import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseBrowserConfigured() {
  return Boolean(
    process.env.VITE_SUPABASE_URL &&
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );
}

export function createSupabaseBrowserClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase browser configuration is missing.");
  return createBrowserClient(url, key);
}
