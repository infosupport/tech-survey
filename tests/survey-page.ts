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
    await this.page.goto(`http://localhost:${this.port}`);
    await this.page.waitForURL(`http://localhost:${this.port}`);

    await expect(
      this.page.getByRole("heading", { name: "Select Roles" }),
    ).toBeVisible();
    await this.page.reload();
  }

  async checkUrl(path: string) {
    expect(this.page.url()).toBe(`http://localhost:${this.port}/${path}`);
  }

  async navigateToAnonymousResults(role: string) {
    await this.page.goto(`http://localhost:${this.port}/result/${role}`);
    await this.page.waitForURL(`http://localhost:${this.port}/result/${role}`);

    // We expect to see the text "View Results" on the page
    await expect(
      this.page.getByText(`Viewing results for role: ${role}`),
    ).toBeVisible();
  }

  async navigateToFindTheExpert(role: string) {
    await this.page.goto(
      `http://localhost:${this.port}/find-the-expert/${role}`,
    );
    await this.page.waitForURL(
      `http://localhost:${this.port}/find-the-expert/${role}`,
    );

    // We expect to see the text "View Results" on the page
    await expect(
      this.page.getByText(`Viewing results for role: ${role}`),
    ).toBeVisible();
  }

  async checkAnonymousResultsIsNotEmpty() {
    // we should not see '404 Not Found' on the page
    await expect(this.page.isHidden("text=404")).resolves.toBe(true);
  }

  async checkUserIsPresentInFindTheExpertPage(
    name: string,
    shouldShowContactOptions: boolean,
  ) {
    const doNotContact = "Do not contact";

    await expect(
      this.page.getByRole("cell", { name: name }).first(),
    ).toBeVisible();

    if (shouldShowContactOptions) {
      await expect(
        this.page.getByRole("cell", { name: doNotContact }).first(),
      ).toBeHidden();
    } else {
      await expect(
        this.page.getByRole("cell", { name: doNotContact }).first(),
      ).toBeVisible();
    }
  }

  async goToNextQuestionsForDifferentRole() {
    await this.page.getByRole("button", { name: "Next", exact: true }).click();
  }

  async submitAnswers() {
    await this.page
      .getByRole("button", { name: "Submit", exact: true })
      .click();
  }

  async selectRoles(roleNames: string[]) {
    for (const roleName of roleNames) {
      const roleCheckbox = this.page
        .locator(`li:has-text("${roleName}")`)
        .first()
        .locator('input[type="checkbox"]');
      await roleCheckbox.check();
    }

    // wait for the roles to be selected
    await this.page.waitForTimeout(1000);
  }

  async selectCommunicationPreferences(preferences: string[]) {
    for (const preference of preferences) {
      const preferenceCheckbox = this.page
        .locator(`li:has-text("${preference}")`)
        .first()
        .locator('input[type="checkbox"]');
      await preferenceCheckbox.check();
    }

    // wait for the roles to be selected
    await this.page.waitForTimeout(1000);
  }

  async navigateToSurveyPage() {
    await this.page
      .getByRole("button", { name: "Go to survey", exact: true })
      .click();
    await this.page.waitForURL(`http://localhost:${this.port}/survey/general`);
  }

  async checkProgressionBarForRoles(roles: string[]) {
    for (const role of roles) {
      await expect(this.page.getByText(role, { exact: true })).toBeVisible();
    }
  }

  async mobileCheckProgressionBarForRoles(roles: string[]) {
    await this.page
      .getByRole("button", {
        name: `${roles[0]} - 0/${roles.length} 0.00% Completed`,
      })
      .click();
    for (const role of roles) {
      await expect(this.page.getByText(role, { exact: true })).toBeVisible();
    }
  }

  async checkRoleForQuestion(questionText: string[]) {
    for (const text of questionText) {
      await expect(this.page.getByText(text)).toBeVisible();
    }
  }

  async selectAnswerOption(questionText: string, optionIndex: number) {
    const optionLocator = this.page
      .getByRole("row", { name: questionText })
      .getByLabel("")
      .nth(optionIndex);
    await optionLocator.click();
  }

  async MobileSelectAnswerOption(questionText: string, optionIndex: number) {
    const question = this.page.getByRole("heading", { name: questionText });
    const questionContainer = question.locator("xpath=../..");
    const radioGroups = questionContainer.locator('[role="radiogroup"]');
    const selectedRadioGroup = radioGroups.nth(0);
    const radioButtons = selectedRadioGroup.locator('button[role="radio"]');
    await radioButtons.click();
  }

  async checkForValidationError(role: string) {
    // Ensure we are still on the same page
    await this.checkUrl(`survey/${role}`);

    // Check if the text "You need to select an answer" is visible
    await expect(
      this.page.getByText("You need to select an answer"),
    ).toBeVisible();
  }
}
