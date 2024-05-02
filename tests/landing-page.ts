// @ts-check
import { expect } from "@playwright/test";
import { type Page } from "playwright";

export class LandingPage {
  private readonly page: Page;
  private readonly port;

  constructor(page: Page, port: number) {
    this.page = page;
    this.port = port;
  }

  async navigateToLandingPage() {
    await this.page.goto(`http://localhost:${this.port}/`);
    await expect(
      this.page.getByRole("heading", { name: "Select Roles" }),
    ).toBeVisible();
  }

  async selectRandomRoles() {
    const roles = this.page.locator("input[type=checkbox]");
    const elementsCount = await roles.count();
    const texts = [];

    // select n random roles
    const randomRoles = Math.floor(Math.random() * elementsCount);
    for (let i = 0; i < randomRoles; i++) {
      const randomIndex = Math.floor(Math.random() * elementsCount);
      const role = roles.nth(randomIndex);

      // get the text of the role, which is under the input element as a label
      const roleElement = await role.elementHandle();
      const siblingElement = await roleElement?.$("+ *");
      const innerText = await siblingElement?.innerText();

      texts.push(innerText);
      await role.check();
    }
    return texts;
  }

  async navigateToSurveyPage() {
    await this.page
      .getByRole("button", { name: "Go to survey", exact: true })
      .click();
    await this.page.waitForURL("/survey/general");
  }
}
