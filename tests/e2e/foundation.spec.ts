import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("foundation shell communicates the thesis and exposes four tabs", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Give everything another life." }),
  ).toBeVisible();
  await expect(page.getByText(/not another recycling scanner/i)).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(navigation.getByRole("link")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Scan something" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Demo analysis—OpenAI is not currently connected/),
  ).toBeVisible();
});

test("@a11y landing has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 402, height: 874 },
  { width: 430, height: 932 },
]) {
  test(`mobile geometry ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const geometry = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      targets: [...document.querySelectorAll<HTMLElement>("a, button")]
        .filter((element) => getComputedStyle(element).visibility !== "hidden")
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            height: rect.height,
            name: element.innerText || element.getAttribute("aria-label"),
            width: rect.width,
          };
        }),
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
    expect(
      geometry.targets.filter(
        (target) => target.height < 44 || target.width < 44,
      ),
    ).toEqual([]);
  });
}

test("manifest and static PWA assets are available", async ({ request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([expect.objectContaining({ purpose: "maskable" })]),
  );
  await expect((await request.get("/sw.js")).status()).toBe(200);
  await expect(
    (await request.get("/icons/apple-touch-icon.png")).status(),
  ).toBe(200);
});
