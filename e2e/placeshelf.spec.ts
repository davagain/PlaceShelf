import { expect, test } from "@playwright/test";

test("recommends demo places and saves a place to the active list", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Sitios con memoria." })).toBeVisible();

  await page.getByPlaceholder("¿Qué sitio buscas?").fill("ramen bueno en Madrid");
  await page.getByRole("button", { name: "Recomendar" }).click();

  await expect(page.getByRole("heading", { name: "Recomendaciones" })).toBeVisible();
  await expect(page.getByText("Chuka Ramen Bar")).toBeVisible();

  await page.getByRole("button", { name: "Guardar" }).first().click();

  await expect(page.getByRole("button", { name: "Guardado" }).first()).toBeVisible();
  await expect(page.getByText("1 sitios")).toBeVisible();
});

test("edits list metadata and manages email collaborators", async ({ page }) => {
  await page.goto("/");

  await page.getByTitle("Editar lista").click();
  await page.locator('input[name="name"]').fill("Canelones Barcelona");
  await page.locator('textarea[name="description"]').fill("Lista para probar canelones buenos en Barcelona.");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByRole("heading", { name: "Canelones Barcelona" })).toBeVisible();
  await expect(page.getByText("Lista para probar canelones buenos en Barcelona.")).toBeVisible();
  await expect(page.getByText("Lista actualizada")).toBeVisible();

  await page.getByPlaceholder("email@dominio.com").fill("friend@example.com");
  await page.getByTitle("Invitar por email").click();

  const collaboratorChip = page.locator("span").filter({ hasText: "friend@example.com" });
  await expect(collaboratorChip).toBeVisible();

  await page.getByTitle("Quitar colaborador").click();
  await expect(collaboratorChip).not.toBeVisible();
});

test("downloads a saved list as JSON", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Recomendar" }).click();
  await expect(page.getByText("Chuka Ramen Bar")).toBeVisible();
  await page.getByRole("button", { name: "Guardar" }).first().click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/madrid-cenas.*\.json/);
});
