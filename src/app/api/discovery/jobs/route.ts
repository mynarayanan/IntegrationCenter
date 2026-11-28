import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DISCOVERY_ROLES = ["owner", "admin", "designer", "operator"];

function logSupabaseError(event: string, error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}) {
  // Never log access tokens, cookies, connector configuration, or secret values.
  console.error(event, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof body.tenantId !== "string" ||
      typeof body.connectionId !== "string"
    ) {
      return NextResponse.json(
        { error: "tenantId and connectionId are required." },
        { status: 400 }
      );
    }

    const jobType = body.jobType === "profile" ? "profile" : "metadata_discovery";
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (authError) logSupabaseError("discovery_authentication_failed", authError);
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Use the SECURITY DEFINER helper so the authorization check is not masked
    // by tenant_members RLS visibility. The same helper is used by the DB policies.
    const { data: hasRole, error: roleError } = await supabase.rpc("has_tenant_role", {
      target_tenant: body.tenantId,
      allowed_roles: DISCOVERY_ROLES
    });

    if (roleError) {
      logSupabaseError("discovery_authorization_check_failed", roleError);
      return NextResponse.json(
        { error: "Could not verify tenant permissions. Check server logs." },
        { status: 500 }
      );
    }

    if (hasRole !== true) {
      return NextResponse.json({ error: "Insufficient role." }, { status: 403 });
    }

    const { data: connection, error: connectionError } = await supabase
      .from("connector_instances")
      .select("id,tenant_id,status")
      .eq("id", body.connectionId)
      .eq("tenant_id", body.tenantId)
      .maybeSingle();

    if (connectionError) {
      logSupabaseError("discovery_connection_lookup_failed", connectionError);
      return NextResponse.json(
        { error: "Could not verify the connection. Check server logs." },
        { status: 500 }
      );
    }

    if (!connection || connection.status !== "active") {
      return NextResponse.json(
        { error: "An active connection in this tenant is required." },
        { status: 400 }
      );
    }

    const { data, error: insertError } = await supabase
      .from("discovery_jobs")
      .insert({
        tenant_id: body.tenantId,
        connector_instance_id: body.connectionId,
        requested_by: user.id,
        job_type: jobType,
        request: { requestedFrom: "data-object-explorer" }
      })
      .select("id,tenant_id,connector_instance_id,job_type,status,created_at")
      .single();

    if (insertError) {
      logSupabaseError("discovery_job_insert_failed", insertError);
      return NextResponse.json(
        { error: "Could not queue discovery job. Check server logs and database policies." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { job: data, execution: "queued_for_trusted_worker" },
      { status: 202 }
    );
  } catch (error) {
    console.error("discovery_job_request_failed", {
      message: error instanceof Error ? error.message : "Unknown request failure"
    });
    return NextResponse.json(
      { error: "Invalid request or Supabase configuration unavailable." },
      { status: 400 }
    );
  }
}
