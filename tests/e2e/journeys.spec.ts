import { test, expect, type Page } from "@playwright/test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const api = process.env.PUBLIC_API_URL || "http://localhost:4000";
const password = "BuildSomething!42";
async function demoLogin(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Join the conversation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explore with the demo account", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "MC Maya Chen @maya_chen" }),
  ).toBeVisible();
}
async function verificationLink(email: string) {
  const directory = process.env.MAIL_DIR || path.resolve("work/mail");
  for (let attempt = 0; attempt < 40; attempt++) {
    const files = await readdir(directory).catch(() => [] as string[]);
    for (const file of files) {
      const text = await readFile(path.join(directory, file), "utf8");
      if (text.includes(`To: ${email}`) && text.includes("/verify?token=")) {
        const link = text.match(/https?:\/\/[^\s]+\/verify\?token=[^\s]+/)?.[0];
        if (link) return link;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Verification email did not reach local outbox.");
}
test("new founder registers, verifies email, onboards, follows, comments, saves and publishes a processed reel", async ({
  page,
}) => {
  const suffix = Date.now().toString(36),
    email = `e2e_${suffix}@example.com`;
  await page.goto("/");
  await page
    .getByRole("button", { name: "Join the conversation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create an account", exact: true })
    .click();
  await page
    .getByLabel("Full name", { exact: true })
    .fill("QA Journey Builder");
  await page.getByLabel("Username", { exact: true }).fill(`e2e_${suffix}`);
  await page.getByLabel("I’m here as").selectOption("FOUNDER");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  const onboarding = page.getByRole("dialog", {
    name: "What sparks your curiosity?",
  });
  await onboarding.getByRole("button", { name: "AI", exact: true }).click();
  await onboarding
    .getByRole("button", { name: "Robotics", exact: true })
    .click();
  await onboarding
    .getByRole("button", { name: "Climate", exact: true })
    .click();
  await onboarding.getByRole("button", { name: "Build my feed" }).click();
  await expect(onboarding).not.toBeVisible();
  await page.goto(await verificationLink(email));
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(
    page.getByText("Your email is verified. You’re ready to join in."),
  ).toBeVisible();
  await page.goto("/startup/nova-robotics");
  await page
    .getByRole("button", { name: "Follow the journey", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Following", exact: true }),
  ).toBeVisible();
  await page.goto("/post/seed-post-001");
  await page.getByRole("button", { name: "Like post", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unlike post", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Save post", exact: true }).click();
  await page
    .getByRole("button", { name: "Open comments", exact: true })
    .click();
  await page
    .getByLabel("Comment", { exact: true })
    .fill(`A thoughtful product. Journey ${suffix}`);
  await page.getByRole("button", { name: "Send comment", exact: true }).click();
  await expect(
    page.getByText(`A thoughtful product. Journey ${suffix}`),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.goto("/saved");
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "Nova Robotics", exact: true }),
  ).toBeVisible();
  await page.goto("/founder");
  await page.getByRole("button", { name: "New startup" }).click();
  const startup = page.getByRole("dialog", { name: "Introduce your startup" });
  await startup.getByLabel("Name", { exact: true }).fill(`Workshop ${suffix}`);
  await startup.getByLabel("URL slug").fill(`workshop-${suffix}`);
  await startup
    .getByLabel("One-line pitch")
    .fill("A thoughtful prototype for curious builders.");
  await startup
    .getByLabel("Description", { exact: true })
    .fill(
      "A demonstration startup used to verify the end-to-end product journey.",
    );
  await startup
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Robotics" });
  await startup.getByRole("button", { name: "Save", exact: true }).click();
  await expect(startup).not.toBeVisible();
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  const product = page.getByRole("dialog", { name: "What are you building?" });
  await product.getByLabel("Name", { exact: true }).fill("Workshop Arm");
  await product.getByLabel("URL slug").fill(`workshop-arm-${suffix}`);
  await product
    .getByLabel("Description", { exact: true })
    .fill("A small modular arm for the integration journey.");
  await product
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Robotics" });
  await product.getByRole("button", { name: "Save", exact: true }).click();
  await expect(product).not.toBeVisible();
  await page.goto("/create");
  await page.getByRole("button", { name: "Product reel", exact: true }).click();
  await page
    .getByLabel("The story")
    .fill(`A working product reel from journey ${suffix}.`);
  await page
    .getByLabel("Startup", { exact: true })
    .selectOption({ label: `Workshop ${suffix}` });
  await page
    .getByLabel("Product", { exact: true })
    .selectOption({ label: "Workshop Arm" });
  await page
    .locator("input[type=file]")
    .setInputFiles(path.resolve("work/media/public/seed/forma.mp4"));
  await expect(page.getByText("Ready to publish", { exact: true })).toBeVisible(
    { timeout: 60000 },
  );
  await page
    .getByRole("button", { name: "Publish update", exact: true })
    .click();
  await expect(page).toHaveURL(/\/post\//);
  await expect(
    page.getByText(`A working product reel from journey ${suffix}.`),
  ).toBeVisible();
  const id = page.url().split("/").at(-1);
  const publicPost = await page.request.get(`${api}/api/posts/${id}`);
  expect(publicPost.status()).toBe(200);
  expect((await publicPost.json()).post.media[0].processingStatus).toBe(
    "READY",
  );
});
test("two builders exchange a realtime message and receive a read receipt", async ({
  page,
  browser,
}) => {
  await demoLogin(page);
  const second = await browser.newContext({
    baseURL: process.env.WEB_ORIGIN || "http://localhost:3000",
  });
  const other = await second.newPage();
  await second.request.post(`${api}/api/auth/login`, {
    data: { email: "arjun_mehta@productscroll.local", password },
  });
  await page.goto("/messages?conversation=seed-conversation-1");
  await other.goto("/messages?conversation=seed-conversation-1");
  await expect(
    other.getByRole("heading", { name: "Your corner of the internet." }),
  ).toBeVisible();
  const body = `Realtime QA ${Date.now()}`;
  await page.getByLabel("Message", { exact: true }).fill(body);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(other.getByText(body, { exact: true })).toBeVisible();
  await expect(
    page
      .locator(".message.own")
      .filter({ hasText: body })
      .getByText("Read", { exact: false }),
  ).toBeVisible();
  await second.close();
});
test("phone layout has five tabs, readable content, working search and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Explore", exact: true })
    .click();
  await page.getByLabel("Search startups, products and people").fill("Nova");
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { name: "Nova Robotics", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "work/phone-preview.png", fullPage: false });
});
