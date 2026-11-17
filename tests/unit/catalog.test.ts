import { describe, expect, it } from "vitest";
import { connectorCatalog, getConnectorById } from "@/lib/connectors/catalog";

describe("connector catalogue", () => {
  it("contains the seven agreed priority connectors", () => {
    expect(connectorCatalog).toHaveLength(7);
  });

  it("has unique connector identifiers", () => {
    const ids = connectorCatalog.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the P0 file and generic API connectors", () => {
    expect(getConnectorById("excel-csv")?.priority).toBe("P0");
    expect(getConnectorById("rest-sftp")?.priority).toBe("P0");
  });

  it("returns undefined for an unknown connector", () => {
    expect(getConnectorById("not-a-connector")).toBeUndefined();
  });
});
