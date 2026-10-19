import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage is mobile-first and accessible", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Aliameen Kareem" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent Projects" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /view all projects/i }),
  ).toHaveAttribute("href", "/projects");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test.describe("project archive touch navigation", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
  });

  for (const name of ["Learn more", "View all projects"]) {
    test(`${name} opens the archive after scrolling`, async ({ page }) => {
      test.setTimeout(90_000);
      const renderErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") renderErrors.push(message.text());
      });
      page.on("pageerror", (error) => renderErrors.push(error.message));
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const link = page
        .getByRole("link", { name: new RegExp(name, "i") })
        .first();
      test.skip(
        name === "Learn more" &&
          !process.env.DATABASE_URL &&
          (await link.count()) === 0,
        "Learn more requires a published pinned project; verify on the populated preview.",
      );
      await link.scrollIntoViewIfNeeded();
      const bounds = await link.boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
      await link.tap();
      await expect(page).toHaveURL(/\/projects$/, { timeout: 15_000 });
      await expect(
        page.getByText("Record of products I have built.", { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      expect(
        renderErrors.filter((error) => /maximum update depth/i.test(error)),
      ).toEqual([]);
    });
  }
});

test("homepage keeps the fixed Now heading without published copy", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Now" })).toBeVisible();
});

test("live coding keeps Bippy glowing and reveals details only when tapped", async ({
  page,
}) => {
  await page.route("**/api/wakatime/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        isCoding: true,
        statsStale: false,
        todayDate: "2026-08-10",
        todayText: "2 hrs 15 mins",
        todaySeconds: 8_100,
        weekSeconds: 18_000,
        dailyAverageSeconds: 9_000,
        topLanguage: { name: "TypeScript", percent: 72 },
        days: [],
        lastActiveAt: "2026-08-10T02:00:00.000Z",
        checkedAt: "2026-08-10T02:00:00.000Z",
      }),
    });
  });
  await page.goto("/");

  const companion = page.getByTestId("bippy-companion");
  const companionAvailable = await companion
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(
    !companionAvailable,
    "Public Bippy is disabled in this environment.",
  );
  await expect(companion).toHaveAttribute("data-coding", "true");
  await expect(page.getByTestId("bippy-message")).toHaveCount(0);

  const glow = await companion.evaluate((element) => ({
    halo: getComputedStyle(element, "::before").content,
    outline: getComputedStyle(element.firstElementChild as Element).filter,
  }));
  expect(glow.halo).not.toBe("none");
  expect(glow.outline).not.toBe("none");

  await page.getByTestId("bippy").click();
  await expect(page.getByTestId("bippy-message")).toContainText(
    "Ameen is coding right now.",
  );
  await expect(page.getByTestId("bippy-message")).toContainText(
    "2 hrs 15 mins today",
  );
  await expect(page.getByTestId("bippy-message")).toHaveCount(0, {
    timeout: 7_000,
  });

  await page.getByTestId("bippy").click();
  await expect(page.getByTestId("bippy-message")).toBeVisible();
});

test("populated Skills stays stable when resized and expanded", async ({
  page,
}) => {
  // The list is database content now, and an empty group renders nothing at
  // all, so without a database there is no section to assert against. Gated
  // the same way the admin specs gate on their Neon Auth credentials.
  test.skip(
    !process.env.DATABASE_URL,
    "A database is required: the Tech Stack is content, not configuration.",
  );
  test.setTimeout(90_000);
  const renderErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") renderErrors.push(message.text());
  });
  page.on("pageerror", (error) => renderErrors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Skills", exact: true }),
  });
  await expect(section).toBeVisible();
  expect(await section.getByRole("listitem").count()).toBeGreaterThan(0);

  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 844 });
    const expand = section.getByRole("button", { name: "Expand skills" });
    // Short categories may already fit at this width and need no toggle.
    if (await expand.count()) {
      await expand.click();
      const collapse = section.getByRole("button", { name: "Collapse skills" });
      await expect(collapse).toHaveAttribute("aria-expanded", "true");
      await collapse.click();
      await expect(expand).toHaveAttribute("aria-expanded", "false");
    }
  }
  expect(
    renderErrors.filter((error) => /maximum update depth/i.test(error)),
  ).toEqual([]);

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("intro contact links do not include Instagram", async ({ page }) => {
  await page.goto("/");
  const contactLinks = page.getByRole("navigation", { name: "Contact links" });
  await expect(
    contactLinks.getByText("Instagram", { exact: true }),
  ).toHaveCount(0);
});

test("resume is not presented as a standalone homepage section", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "View Resume" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("link", { name: "Email me" })).toHaveCount(0);

  // The closing call to action is the message dialog; the résumé is offered
  // in the contact links above rather than repeated here.
  const contact = page.locator("#contact");
  // The invitation ends after the message action.
  await expect(contact.locator("p")).toHaveText(
    /Open to a nice conversation, send a message\./,
  );
  // A dialog trigger, not a mailto link: it offers a choice of channel rather
  // than committing the visitor to email before they have picked one.
  await contact.getByRole("button", { name: "send a message" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", { name: /Email/ })).toHaveAttribute(
    "href",
    /^mailto:/,
  );
  await page.keyboard.press("Escape");
  // The résumé is not repeated in the closing contact sentence.
  await expect(
    contact.getByRole("button", { name: "view resume" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /view resume/i })).toHaveCount(0);
});

test("projects archive remains a single dedicated page", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("link", { name: "Projects" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    page.getByText("Record of products I have built."),
  ).toBeVisible();
  await expect(page.locator('a[href^="/projects/"]')).toHaveCount(0);
});
