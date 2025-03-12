import {
    type Prisma,
    type PrismaClient,
    type PrismaDbClient,
    type Question,
} from "~/prisma";
import { TRPCClientError } from "@trpc/client";
import type { QuestionResult } from "@prisma/client";

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
        return await this.#db.questionResult.findMany({
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

    async uploadNewSurvey(surveyData: {
        surveyDate: Date;
        surveyName: string;
        questions: {
            questionText: string;
            roles: {
                id: string;
                role: string;
                default: boolean;
            }[];
        }[];
    }) {
        try {
            const questions = surveyData.questions;
            const currentSurveyId = await this.getLatestSurveyId();

            let currentSurveyQuestions: QuestionWithResult[] = [];

            if (currentSurveyId) {
                // 1. Find existing questions for the current survey
                currentSurveyQuestions = await this.#db.question.findMany({
                    where: {
                        surveyId: currentSurveyId,
                    },
                    include: {
                        QuestionResult: true,
                    },
                });
            }
            // 2. Create a new survey
            const questionsCreate = questions.map((question) => ({
                questionText: question.questionText,
                roles: {
                    // Link the question to the existing roles
                    connect: question.roles.map((role) => ({
                        id: role.id,
                    })),
                },
            }));
            const newSurvey = await this.#db.survey.create({
                data: {
                    surveyDate: surveyData.surveyDate,
                    surveyName: surveyData.surveyName,
                    questions: {
                        create: questionsCreate,
                    },
                },
                include: {
                    questions: true,
                },
            });
            const insertedQuestions = newSurvey.questions;

            // 3. Copy existing question results to the new survey
            let newQuestionResults: Prisma.QuestionResultCreateManyInput[] = [];
            for (const question of insertedQuestions) {
                const existingQuestion = currentSurveyQuestions.find(
                    (q) => q.questionText === question.questionText,
                );
                if (existingQuestion) {
                    const questionResultsToAdd =
                        existingQuestion.QuestionResult.map((qr) => ({
                            userId: qr.userId,
                            answerId: qr.answerId,
                            questionId: question.id,
                        }));
                    newQuestionResults = [
                        ...newQuestionResults,
                        ...questionResultsToAdd,
                    ];
                }
            }

            // 4. Insert new question results
            await this.#db.questionResult.createMany({
                data: newQuestionResults,
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new TRPCClientError(
                    `Error uploading survey: ${error.message}`,
                );
            }
        }
    }
}

type QuestionWithResult = Question & {
    QuestionResult: QuestionResult[];
};
