import { AppShell } from "@/components/app-shell";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  if (!appConfig.demoMode) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) redirect("/sign-in");
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      redirect("/sign-in");
    }
  }
  return <AppShell>{children}</AppShell>;
}
