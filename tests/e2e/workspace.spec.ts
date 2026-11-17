import { test, expect } from "@playwright/test";

test("overview page renders key platform summary", async ({ page }) => {
  await page.goto("/overview");
  await expect(page.getByRole("heading", { name: "Integration overview" })).toBeVisible();
  await expect(page.getByText("Connector types")).toBeVisible();
  await expect(page.getByRole("link", { name: /Connector catalogue/ })).toBeVisible();
});

test("connector catalogue lists all seven priority connectors", async ({ page }) => {
  await page.goto("/connectors");
  await expect(page.getByRole("heading", { name: "Connector catalogue" })).toBeVisible();
  for (const name of ["Excel / CSV", "REST API / SFTP", "Snowflake", "Oracle Cloud EPM", "Anaplan", "Board", "IBM Planning Analytics / TM1"]) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
});

test("health endpoint returns an ok status", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
});
