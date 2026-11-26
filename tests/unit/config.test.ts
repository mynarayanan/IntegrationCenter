import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("production configuration", () => {
  it("rejects demo mode in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
    vi.resetModules();
    const { assertProductionConfiguration } = await import("@/lib/config");

    expect(assertProductionConfiguration).toThrow("Demo mode");
  });

  it("requires Supabase configuration in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    vi.resetModules();
    const { assertProductionConfiguration } = await import("@/lib/config");

    expect(assertProductionConfiguration).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("allows demo mode outside production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    vi.resetModules();
    const { assertProductionConfiguration } = await import("@/lib/config");

    expect(assertProductionConfiguration).not.toThrow();
  });
});
