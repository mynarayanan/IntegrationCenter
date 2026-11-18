import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

async function sessionAndRole(connectionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: connection } = await supabase
    .from("connector_instances")
    .select("id,tenant_id")
    .eq("id", connectionId)
    .maybeSingle();
  if (!connection) {
    return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const { data: member } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", connection.tenant_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase, user, connection, role: member.role };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const auth = await sessionAndRole(id);
    if ("response" in auth) return auth.response;
    if (!["owner", "admin", "designer"].includes(auth.role)) {
      return NextResponse.json({ error: "Insufficient role." }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be a JSON object." }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name.length < 2 || name.length > 80) {
        return NextResponse.json({ error: "Connection name must be 2–80 characters." }, { status: 400 });
      }
      update.name = name;
    }
    if (typeof body.status === "string") {
      if (!["draft", "active", "disabled"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      update.status = body.status;
    }
    if (body.config !== undefined) {
      if (!body.config || typeof body.config !== "object" || Array.isArray(body.config)) {
        return NextResponse.json({ error: "Config must be an object." }, { status: 400 });
      }
      if (Object.keys(body.config).some((key: string) => /password|secret|token|private.?key|credential/i.test(key))) {
        return NextResponse.json({ error: "Secret values are forbidden in config." }, { status: 400 });
      }
      if (JSON.stringify(body.config).length > 8000) {
        return NextResponse.json({ error: "Configuration is too large." }, { status: 400 });
      }
      update.config = body.config;
    }
    if (body.secretReference !== undefined) {
      if (body.secretReference === null) {
        update.secret_reference = null;
      } else if (
        typeof body.secretReference === "string" &&
        body.secretReference.length <= 200 &&
        !/[\r\n]/.test(body.secretReference)
      ) {
        update.secret_reference = body.secretReference.trim();
      } else {
        return NextResponse.json({ error: "Secret reference is invalid." }, { status: 400 });
      }
    }
    if (!Object.keys(update).length) {
      return NextResponse.json({ error: "No valid update fields provided." }, { status: 400 });
    }

    update.updated_at = new Date().toISOString();
    const { data, error } = await auth.supabase
      .from("connector_instances")
      .update(update)
      .eq("id", id)
      .select("id,name,status,config,secret_reference,updated_at")
      .single();
    if (error) {
      return NextResponse.json({ error: "Update failed." }, { status: 500 });
    }
    return NextResponse.json({ connection: data });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const auth = await sessionAndRole(id);
    if ("response" in auth) return auth.response;
    if (!["owner", "admin"].includes(auth.role)) {
      return NextResponse.json({ error: "Owner/Admin role required." }, { status: 403 });
    }
    const { error } = await auth.supabase
      .from("connector_instances")
      .delete()
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Delete failed." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 400 });
  }
}
