import { describe, expect, it } from "vitest";
import { isNavigationActive } from "@/lib/navigation";

describe("navigation helpers", () => {
  it("marks the overview page as active when the user is on the overview route", () => {
    expect(isNavigationActive("/overview", "/overview")).toBe(true);
    expect(isNavigationActive("/overview", "/connectors")).toBe(false);
  });

  it("supports nested paths for sibling workspace routes", () => {
    expect(isNavigationActive("/jobs/scheduled", "/jobs")).toBe(true);
    expect(isNavigationActive("/connectors/finance", "/connectors")).toBe(true);
  });
});
