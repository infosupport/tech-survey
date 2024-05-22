// @ts-check
import { type PrismaClient } from "@prisma/client";

export class DbHelper {
  private readonly client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
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
