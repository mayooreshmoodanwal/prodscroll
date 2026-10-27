import { test, expect } from "@playwright/test";

test("reels snap one viewport at a time and refill each ten-item batch at reel seven", async ({
  page,
}) => {
  await page.goto("/reels");
  const scroller = page.getByTestId("reels-scroller");
  await expect(scroller).toHaveAttribute("data-loaded-count", "10");
  await expect(scroller).toHaveAttribute("data-active-index", "0");
  const batchRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/reels")
      batchRequests.push(request.url());
  });
  for (let index = 1; index <= 26; index++) {
    await page.getByRole("button", { name: "Next reel", exact: true }).click();
    await expect(scroller).toHaveAttribute("data-active-index", String(index));
    await expect
      .poll(() =>
        scroller.evaluate((el) => Math.abs(el.scrollTop % el.clientHeight)),
      )
      .toBeLessThan(2);
    if (index === 5) {
      await expect(scroller).toHaveAttribute("data-loaded-count", "10");
      expect(batchRequests).toHaveLength(0);
    }
    if ([6, 16, 26].includes(index)) {
      await expect(scroller).toHaveAttribute(
        "data-loaded-count",
        String(index + 14),
      );
      expect(batchRequests).toHaveLength(Math.floor(index / 10) + 1);
    }
    expect(await page.locator(".reel-slot").count()).toBeLessThanOrEqual(5);
    expect(
      await page
        .locator("video")
        .evaluateAll(
          (videos) =>
            videos.filter((v) => !(v as HTMLVideoElement).paused).length,
        ),
    ).toBeLessThanOrEqual(1);
  }
  await page
    .getByRole("button", { name: "Previous reel", exact: true })
    .click();
  await expect(scroller).toHaveAttribute("data-active-index", "25");
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(scroller).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: "For you", exact: true }),
  ).toBeVisible();
});

test("phone reels fill the viewport above navigation without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/reels");
  const scroller = page.getByTestId("reels-scroller");
  await expect(scroller).toHaveAttribute("data-loaded-count", "10");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const size = await scroller.evaluate((el) => ({
    viewport: el.clientHeight,
    reel: el.querySelector("article")!.clientHeight,
  }));
  expect(size.viewport).toBe(size.reel);
  expect(size.viewport).toBeLessThan(844);
  expect(size.viewport).toBeGreaterThan(700);
  await scroller.press("ArrowDown");
  await expect(scroller).toHaveAttribute("data-active-index", "1");
});
