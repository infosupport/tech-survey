import { test as setup } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("http://localhost:3000/api/auth/signin");
  await page.getByLabel("Username").fill("playwright");
  await page.getByLabel("Password").fill("playwright");
  await page
    .getByRole("button", { name: "Sign in with Credentials", exact: true })
    .click();

  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL("http://localhost:3000/");

  // End of authentication steps.
  await page.context().storageState({ path: authFile });
});
