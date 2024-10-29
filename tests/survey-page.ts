// @ts-check
import { type Page } from "playwright";

export class SurveyPage {
  private readonly page: Page;
  private readonly port;

  constructor(page: Page, port: number) {
    this.page = page;
    this.port = port;
  }

  async navigateToLandingPage() {
    await this.page.goto(`http://localhost:${this.port}`);
    await this.page.waitForURL(`http://localhost:${this.port}`);
    const headingElement = this.page.getByRole("heading", {
      name: "Select Roles",
    });
    await this.page.reload();
    return headingElement;
  }

  async checkUrl(path: string) {
    return this.page.url() === `http://localhost:${this.port}/${path}`;
  }

  async navigateToAnonymousResults(role: string) {
    await this.page.goto(`http://localhost:${this.port}/result?role=${role}`);
    await this.page.waitForURL(`http://localhost:${this.port}/result?role=${role}`);
    const isTextVisible = await this.page
      .getByText(`Viewing results for role: ${role}`)
      .isVisible();
    return isTextVisible;
  }

  async navigateToFindTheExpert(role: string) {
    await this.page.goto(
      `http://localhost:${this.port}/find-the-expert/${role}`,
    );
    await this.page.waitForURL(
      `http://localhost:${this.port}/find-the-expert/${role}`,
    );
    const isTextVisible = await this.page
      .getByText(`Viewing results for role: ${role}`)
      .isVisible();
    return isTextVisible;
  }

  async checkAnonymousResultsIsNotEmpty() {
    // we should not see '404 Not Found' on the page
    return this.page.isHidden("text=404");
  }

  async checkUserIsPresentInFindTheExpertPage(
    name: string,
    shouldShowContactOptions: boolean,
  ): Promise<{ isUserVisible: boolean; isDoNotContactVisible: boolean }> {
    const doNotContact = "Do not contact";

    const isUserVisible = await this.page
      .getByRole("cell", { name: name })
      .first()
      .isVisible();

    let isDoNotContactVisible = false;
    if (shouldShowContactOptions) {
      isDoNotContactVisible = await this.page
        .getByRole("cell", { name: doNotContact })
        .first()
        .isHidden();
    } else {
      isDoNotContactVisible = await this.page
        .getByRole("cell", { name: doNotContact })
        .first()
        .isVisible();
    }

    return { isUserVisible, isDoNotContactVisible };
  }

  async goToNextQuestionsForDifferentRole() {
    await this.page.getByRole("button", { name: "Next", exact: true }).click();
  }

  async submitAnswers() {
    await this.page
      .getByRole("button", { name: "Submit", exact: true })
      .click();
  }

  async selectRoles(roleNames: readonly string[]) {
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

  async selectCommunicationPreferences(preferences: readonly string[]) {
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

  async checkProgressionBarForRoles(roles: readonly string[]) {
    const roleElements = [];
    for (const role of roles) {
      const roleElement = this.page.getByText(role, { exact: true });
      roleElements.push(roleElement);
    }
    return roleElements;
  }

  async mobileCheckProgressionBarForRoles(roles: readonly string[]) {
    const roleElements = [];
    await this.page
      .getByRole("button", {
        name: `${roles[0]} - 0/${roles.length} 0.00% Completed`,
      })
      .click();
    for (const role of roles) {
      const roleElement = this.page.getByText(role, { exact: true });
      roleElements.push(roleElement);
    }

    return roleElements;
  }

  async checkRoleForQuestion(questionText: string[]) {
    const questionElements = [];
    for (const text of questionText) {
      const questionElement = this.page.getByText(text);
      questionElements.push(questionElement);
    }
    return questionElements;
  }

  async selectAnswerOption(questionText: string, optionIndex: number) {
    const optionLocator = this.page
      .getByRole("row", { name: questionText })
      .getByLabel("")
      .nth(optionIndex);
    await optionLocator.click();
  }

  async mobileSelectAnswerOption(questionText: string) {
    const question = this.page.getByRole("heading", { name: questionText });
    const questionContainer = question.locator("xpath=../..");
    const radioGroups = questionContainer.locator('[role="radiogroup"]');
    const selectedRadioGroup = radioGroups.nth(0);
    const radioButtons = selectedRadioGroup.locator('button[role="radio"]');
    await radioButtons.click();
  }

  async checkForValidationError(role: string) {
    await this.checkUrl(`survey/${role}`);
    return this.page.getByText("You need to select an answer");
  }
}
