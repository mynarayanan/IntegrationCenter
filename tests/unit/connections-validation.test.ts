import { describe, expect, it } from "vitest";
import { isUuid, validateConnectionPayload } from "@/lib/connections/validation";

const validPayload = {
  tenantId: "550e8400-e29b-41d4-a716-446655440000",
  connectorId: "excel-csv",
  name: "Finance Upload",
  config: { sourceType: "excel_or_csv" },
  secretReference: null
};

describe("connection payload validation", () => {
  it("rejects non-object payloads", () => {
    expect(validateConnectionPayload(null).ok).toBe(false);
    expect(validateConnectionPayload([]).ok).toBe(false);
  });

  it("rejects unsupported connector and invalid tenant IDs", () => {
    expect(validateConnectionPayload({ ...validPayload, connectorId: "unknown" }).ok).toBe(false);
    expect(validateConnectionPayload({ ...validPayload, tenantId: "tenant-1" }).ok).toBe(false);
  });

  it("rejects invalid names and configuration values", () => {
    expect(validateConnectionPayload({ ...validPayload, name: " " }).ok).toBe(false);
    expect(validateConnectionPayload({ ...validPayload, name: "x".repeat(81) }).ok).toBe(false);
    expect(validateConnectionPayload({ ...validPayload, config: [] }).ok).toBe(false);
  });

  it("rejects embedded secret fields", () => {
    expect(validateConnectionPayload({ ...validPayload, config: { password: "secret" } }).ok).toBe(false);
  });

  it("accepts bounded secret references and UUIDs", () => {
    expect(validateConnectionPayload(validPayload).ok).toBe(true);
    expect(isUuid(validPayload.tenantId)).toBe(true);
  });

  it("rejects line breaks and oversized secret references", () => {
    expect(validateConnectionPayload({ ...validPayload, secretReference: "vault\nkey" }).ok).toBe(false);
    expect(validateConnectionPayload({ ...validPayload, secretReference: "x".repeat(201) }).ok).toBe(false);
  });
});
