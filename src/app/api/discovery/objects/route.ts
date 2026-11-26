import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { data: member } = await supabase.from("tenant_members").select("role")
      .eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle();
    if (!member) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const { data, error } = await supabase.from("discovered_objects")
      .select("id,tenant_id,connector_instance_id,source_object_key,object_name,qualified_name,object_type,description,schema_definition,estimated_row_count,discovery_status,fpna_tags,discovered_at")
      .eq("tenant_id", tenantId).order("discovered_at", { ascending: false }).limit(500);
    if (error) return NextResponse.json({ error: "Could not load discovered objects. Apply migration 0003." }, { status: 500 });
    return NextResponse.json({ objects: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Supabase configuration missing or server error." }, { status: 503 });
  }
}
