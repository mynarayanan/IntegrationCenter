import { describe, expect, it } from "vitest";
import { profileCsv } from "@/lib/discovery/profile-csv";

describe("profileCsv", () => {
  it("profiles types, blanks, distinct and repeated values", () => {
    const result = profileCsv("Account,Amount,Active\n1000,25.5,true\n1000,,false\n2000,12.0,true");
    expect(result.rowCount).toBe(3);
    expect(result.columnCount).toBe(3);
    expect(result.columns[0].inferredType).toBe("number");
    expect(result.columns[0].distinctCount).toBe(2);
    expect(result.columns[0].duplicateCount).toBe(1);
    expect(result.columns[1].nullCount).toBe(1);
    expect(result.columns[2].inferredType).toBe("boolean");
  });

  it("handles quoted commas and escaped quotes", () => {
    const result = profileCsv('Name,Comment\n"North, America","said ""hello"""');
    expect(result.columns[0].sampleValues).toEqual(["North, America"]);
    expect(result.columns[1].sampleValues).toEqual(['said "hello"']);
  });

  it("rejects header-only input", () => {
    expect(() => profileCsv("Account,Amount")).toThrow(/header and at least one data row/i);
  });
});
