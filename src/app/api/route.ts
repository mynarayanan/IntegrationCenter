import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateConnectionPayload, connectionTypeForConnector } from "@/lib/connections/validation";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: member } = await supabase.from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle();
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { data, error } = await supabase.from("connector_instances")
      .select("id,tenant_id,connector_id,name,environment,status,config,secret_reference,created_at,updated_at,last_tested_at,last_test_status,last_test_message")
      .eq("tenant_id", tenantId).order("updated_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Could not load connections." }, { status: 500 });
    return NextResponse.json({ connections: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Supabase configuration missing or server error." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateConnectionPayload(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const v = parsed.value;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase.from("tenant_members").select("role")
      .eq("tenant_id", v.tenantId).eq("user_id", user.id).maybeSingle();
    if (!member || !["owner","admin","designer"].includes(member.role)) return NextResponse.json({ error: "Insufficient role." }, { status: 403 });

    const { data, error } = await supabase.from("connector_instances").insert({
      tenant_id: v.tenantId, connector_id: v.connectorId, name: v.name,
      connection_type: connectionTypeForConnector[String(v.connectorId)],
      description: null, environment: "development", status: "draft",
      config: v.config, secret_reference: v.secretReference, created_by: user.id
    }).select("id,tenant_id,connector_id,name,environment,status,config,secret_reference,created_at,updated_at,last_test_status").single();
    if (error) return NextResponse.json({ error: "Connection creation failed. Verify migration 0002 was applied." }, { status: 500 });
    return NextResponse.json({ connection: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request or Supabase configuration unavailable." }, { status: 400 });
  }
}
