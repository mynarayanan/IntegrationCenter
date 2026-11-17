import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    application: appConfig.appName,
    version: "0.1.0",
    mode: appConfig.demoMode ? "demo" : "configured",
    timestamp: new Date().toISOString()
  });
}
