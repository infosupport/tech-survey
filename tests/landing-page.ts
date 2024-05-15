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
    await this.page.goto(`http://localhost:${this.port}/`);
    await expect(
      this.page.getByRole("heading", { name: "Select Roles" }),
    ).toBeVisible();
  }

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
      },
    });
    return role.id;
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
