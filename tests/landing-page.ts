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

  async navigateToSurveyPage() {
    await this.page
      .getByRole("button", { name: "Go to survey", exact: true })
      .click();
    await this.page.waitForURL("/survey/general");
  }
}
