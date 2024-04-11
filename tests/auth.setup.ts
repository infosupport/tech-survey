import { test as setup } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

const authFile = "playwright/.auth/user.json";
dotenvConfig();

setup("authenticate", async ({ page }) => {
  // change the process.env.FRESH_RUN to true to remove the e2e user from the database
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("http://localhost:3000/");
  await page.click("text=Go to Survey");
  await page
    .getByLabel("Username or email address")
    .fill(process.env.EMAIL ?? "");
  await page.getByLabel("Password").fill(process.env.PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  // There is a chance that we will need to authorize the app. In that case, we need to click the "Authorize" button.
  if (await page.isVisible("text=Reauthorization required")) {
    await page
      .getByRole("button", { name: "Authorize e2eTestAccount", exact: true })
      .click();
  }

  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL("http://localhost:3000/");
  // Alternatively, you can wait until the page reaches a state where all cookies are set.

  // End of authentication steps.
  await page.context().storageState({ path: authFile });
});
