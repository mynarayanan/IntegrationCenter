import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        typeof body.tenantId !== "string" || typeof body.connectionId !== "string") {
      return NextResponse.json({ error: "tenantId and connectionId are required." }, { status: 400 });
    }
    const jobType = body.jobType === "profile" ? "profile" : "metadata_discovery";
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { data: member } = await supabase.from("tenant_members").select("role")
      .eq("tenant_id", body.tenantId).eq("user_id", user.id).maybeSingle();
    if (!member || !["owner", "admin", "designer", "operator"].includes(member.role)) {
      return NextResponse.json({ error: "Insufficient role." }, { status: 403 });
    }
    const { data: connection } = await supabase.from("connector_instances")
      .select("id,tenant_id,status").eq("id", body.connectionId)
      .eq("tenant_id", body.tenantId).maybeSingle();
    if (!connection || connection.status !== "active") {
      return NextResponse.json({ error: "An active connection in this tenant is required." }, { status: 400 });
    }
    const { data, error } = await supabase.from("discovery_jobs").insert({
      tenant_id: body.tenantId,
      connector_instance_id: body.connectionId,
      requested_by: user.id,
      job_type: jobType,
      request: { requestedFrom: "data-object-explorer" }
    }).select("id,tenant_id,connector_instance_id,job_type,status,created_at").single();
    if (error) return NextResponse.json({ error: "Could not queue job. Apply migration 0003." }, { status: 500 });
    return NextResponse.json({ job: data, execution: "queued_for_trusted_worker" }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Invalid request or Supabase configuration unavailable." }, { status: 400 });
  }
}
