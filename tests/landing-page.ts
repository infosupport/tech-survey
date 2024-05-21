// @ts-check
import { expect } from "@playwright/test";
import { type Page } from "playwright";
import { type PrismaClient } from "@prisma/client";

export class LandingPage {
  private readonly page: Page;
  private readonly port;
  private readonly client: PrismaClient;

  constructor(page: Page, port: number, client: PrismaClient) {
    this.page = page;
    this.port = port;
    this.client = client;
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

  async navigateToSurveyPage() {
    await this.page
      .getByRole("button", { name: "Go to survey", exact: true })
      .click();
    await this.page.waitForURL(`http://localhost:${this.port}/survey/general`);
  }

  async checkProgressionBarForRoles(roles: string[]) {
    for (const role of roles) {
      await expect(this.page.getByText(role)).toBeVisible();
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

  // ---- db functions ----

  async createSurvey(surveyName: string): Promise<string> {
    const survey = await this.client.survey.create({
      data: {
        surveyName: surveyName,
      },
    });
    return survey.id;
  }

  async createQuestion(
    surveyId: string,
    roleIds: string[],
    questionText: string,
  ): Promise<string> {
    const question = await this.client.question.create({
      data: {
        questionText: questionText,
        surveyId: surveyId,
        roles: { connect: roleIds.map((id) => ({ id })) },
      },
    });
    return question.id;
  }

  async createAnswerOption(option: number) {
    await this.client.answerOption.create({
      data: {
        option: option,
      },
    });
  }

  async createRole(roleName: string) {
    const role = await this.client.role.create({
      data: {
        role: roleName,
        default: roleName === "General" ? true : false,
      },
    });
    return role.id;
  }

  async createQuestionResult(
    userId: string,
    questionId: string,
    answerId: string,
  ) {
    const questionResult = await this.client.questionResult.create({
      data: {
        userId: userId,
        questionId: questionId,
        answerId: answerId,
      },
    });
    return questionResult.id;
  }

  async createUser(name: string, email: string) {
    const user = await this.client.user.create({
      data: {
        name: name,
        email: email,
      },
    });
    return user.id;
  }

  async getSurveys() {
    return this.client.survey.findMany();
  }

  async getRoles() {
    return this.client.role.findMany();
  }

  async getQuestions() {
    return this.client.question.findMany();
  }

  async getAnswerOptions() {
    return this.client.answerOption.findMany();
  }

  async getUsers() {
    return this.client.user.findMany();
  }

  async getQuestionResult() {
    return this.client.questionResult.findMany();
  }

  async getQuestionsCount() {
    return this.client.question.count();
  }

  async getNumberOfQuestionsForSurvey(surveyId: string) {
    return this.client.question.count({
      where: {
        surveyId: surveyId,
      },
    });
  }

  async getRolesAssignedToQuestion(questionId: string) {
    const question = await this.client.question.findUnique({
      where: {
        id: questionId,
      },
      include: {
        roles: true,
      },
    });
    return question?.roles ?? [];
  }
}
