import type { PrismaClient, PrismaDbClient } from "~/prisma";

export class SurveyPrismaClient {
    #prismaClient: PrismaClient;
    #db: PrismaDbClient;

    constructor(prismaClient: PrismaClient, db: PrismaDbClient) {
        this.#prismaClient = prismaClient;
        this.#db = db;
    }

    async getLatestSurveyId() {
        const survey = await this.#db.survey.findFirst({
            orderBy: {
                surveyDate: "desc",
            },
        });
        return survey?.id ?? null;
    }

    async getCurrentSurveyPageData(userId: string, role: string) {
        const surveyId = await this.#prismaClient.surveys.getLatestSurveyId();

        if (surveyId === null) {
            return null;
        }

        const survey = (await this.#db.survey.findUnique({
            where: {
                id: surveyId,
            },
            include: {
                questions: {
                    where: {
                        roles: {
                            some: {
                                role: {
                                    equals: role,
                                    mode: "insensitive",
                                },
                            },
                        },
                    },
                    include: {
                        QuestionResult: {
                            where: {
                                userId: userId,
                            },
                            include: {
                                question: true,
                            },
                        },
                    },
                },
            },
        }))!;

        const roles = await this.#db.role.findMany({
            where: {
                users: {
                    some: {
                        id: userId,
                    },
                },
            },
        });

        const answerOptions = await this.#db.answerOption.findMany();

        const userAnswersForRole = await this.#db.questionResult.findMany({
            where: {
                userId: userId,
                question: {
                    roles: {
                        some: {
                            role: {
                                equals: role,
                                mode: "insensitive",
                            },
                        },
                    },
                },
            },
            include: {
                question: {
                    include: {
                        roles: true,
                    },
                },
            },
        });

        return { survey, answerOptions, roles, userAnswersForRole };
    }

    async getUserAnswersWithRoles(userId: string) {
        return this.#db.questionResult.findMany({
            where: {
                userId: userId,
            },
            include: {
                question: {
                    include: {
                        roles: true,
                    },
                },
            },
        });
    }

    async getSurveyQuestionsCompletedPerRole(surveyId: string, userId: string) {
        const userRolesWithQuestions = await this.#db.role.findMany({
            where: {
                users: {
                    some: {
                        id: userId,
                    },
                },
            },
            include: {
                questions: {
                    where: {
                        surveyId: surveyId,
                    },
                    include: {
                        QuestionResult: {
                            where: {
                                userId: userId,
                            },
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        const result: Record<
            string,
            { totalQuestions: number; answeredQuestions: number }
        > = {};

        for (const role of userRolesWithQuestions) {
            const totalQuestions = role.questions.length;
            const answeredQuestions = role.questions.filter(
                (question) => question.QuestionResult.length > 0,
            ).length;

            result[role.id] = {
                totalQuestions,
                answeredQuestions,
            };
        }

        return result;
    }
}
