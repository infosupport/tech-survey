// @ts-check
import { expect } from "@playwright/test";
import { type Page } from "playwright";
import { type PrismaClient } from "@prisma/client";
import { getServerAuthSession } from "~/server/auth";
import jwt from "next-auth/jwt";

export interface DefaultJWT extends Record<string, unknown> {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  sub?: string;
}

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
    const payload: DefaultJWT = {
      name: "Test User",
      email: "a@a.com",
      picture: null,
      sub: "1234567890",
    };

    const token = async () => {
      return jwt.encode({
        token: payload,
        secret: process.env.NEXTAUTH_SECRET || "",
      });
    };

    const sessionCookie = {
      name: "next-auth.session-token",
      value: await token(),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax" as const,
    };

    // Make sure we mock the /api/auth/session endpoint here
    await this.page.context().addCookies([sessionCookie]);
    await this.page.goto(`http://localhost:${this.port}`);
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
