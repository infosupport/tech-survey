import type { Prisma, PrismaClient, PrismaDbClient } from "~/prisma";
import { TRPCClientError } from "@trpc/client";

export class QuestionResultPrismaClient {
    #prismaClient: PrismaClient;
    #db: PrismaDbClient;

    constructor(prismaClient: PrismaClient, db: PrismaDbClient) {
        this.#prismaClient = prismaClient;
        this.#db = db;
    }

    /**
     *
     * @returns all QuestionResults from a Survey including Roles filtered by Role and BusinessUnit
     */
    async getResultPageData(
        roleId: string | null,
        businessUnitId: string | null,
    ) {
        if (!roleId && !businessUnitId) {
            return [];
        }

        const surveyId = await this.#prismaClient.surveys.getLatestSurveyId();
        if (surveyId === null) {
            return [];
        }

        const whereConditions: Prisma.QuestionResultWhereInput = {
            question: {
                surveyId: surveyId,
            },
        };

        if (roleId) {
            whereConditions.question = {
                surveyId: surveyId,
                roles: {
                    some: {
                        role: {
                            equals: roleId,
                            mode: "insensitive",
                        },
                    },
                },
            };
        }

        if (businessUnitId) {
            whereConditions.user = {
                businessUnit: {
                    unit: {
                        equals: businessUnitId,
                        mode: "insensitive",
                    },
                },
            };
        }

        return this.#db.questionResult.findMany({
            where: whereConditions,
            include: {
                question: {
                    include: {
                        roles: true,
                    },
                },
            },
        });
    }

    async getQuestionResultsByRole(
        role: string | null,
        questionText: string | null,
        businessUnit: string | null,
    ) {
        const surveyId = await this.#prismaClient.surveys.getLatestSurveyId();
        if (surveyId === null) {
            return [];
        }

        const where = buildGetQuestionResultsByRoleWhereClause(
            surveyId,
            role,
            questionText,
            businessUnit,
        );

        return this.#db.questionResult.findMany({
            where,
            include: {
                question: {
                    include: {
                        roles: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        communicationPreferences: {
                            select: { methods: true },
                        },
                        roles: {
                            select: { role: true },
                        },
                    },
                },
                answer: {
                    select: {
                        id: true,
                        optionValue: true,
                    },
                },
            },
        });
    }

    async getRecentQuestionResultsWithRolesByUserId(userId: string) {
        const surveyId = await this.#prismaClient.surveys.getLatestSurveyId();
        if (surveyId === null) {
            return [];
        }

        return this.#db.questionResult.findMany({
            where: {
                userId: userId,
                question: {
                    surveyId: surveyId,
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
    }

    async setQuestionResultForUser(
        userId: string,
        questionId: string,
        answerId: string,
    ) {
        try {
            const [questionExists, answerOptionExists, userExists] =
                await Promise.all([
                    this.#db.question.count({
                        where: {
                            id: questionId,
                        },
                    }),
                    this.#db.answerOption.count({
                        where: {
                            id: answerId,
                        },
                    }),
                    this.#db.user.count({
                        where: {
                            id: userId,
                        },
                    }),
                ]);

            if (questionExists === 0) {
                throw new TRPCClientError(
                    `Question with ID ${questionId} not found`,
                );
            }
            if (answerOptionExists === 0) {
                throw new TRPCClientError(
                    `Answer with ID ${answerId} not found`,
                );
            }
            if (userExists === 0) {
                throw new TRPCClientError(`User with ID ${userId} not found`);
            }

            const existingQuestionResult =
                await this.#db.questionResult.findFirst({
                    where: {
                        userId: userId,
                        questionId: questionId,
                    },
                });

            await this.#db.questionResult.upsert({
                where: {
                    userId_questionId: {
                        userId: userId,
                        questionId: questionId,
                    },
                },
                update: {
                    answerId: answerId,
                },
                create: {
                    userId: userId,
                    questionId: questionId,
                    answerId: answerId,
                },
                include: {
                    question: true,
                },
            });

            // Return this to update the percentage complete on the client
            return existingQuestionResult === null;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Error processing answers:", error);
            throw new TRPCClientError("Failed to process all answers");
        }
    }
}

const buildGetQuestionResultsByRoleWhereClause = (
    surveyId: string,
    role: string | null,
    questionText: string | null,
    businessUnit: string | null,
) => {
    const questionWhere: Prisma.QuestionWhereInput = {
        surveyId: surveyId,
    };

    // Only select the role that is selected. This ensures we don't have to filter out the roles later
    if (role !== null) {
        questionWhere.roles = {
            some: {
                role: {
                    equals: role,
                    mode: "insensitive",
                },
            },
        };
    }

    if (questionText !== null) {
        questionWhere.questionText = {
            contains: questionText,
            mode: "insensitive",
        };
    }

    const userWhere: Prisma.UserWhereInput = {};

    if (businessUnit !== null) {
        userWhere.businessUnit = {
            unit: {
                equals: businessUnit,
                mode: "insensitive",
            },
        };
    }

    const where: Prisma.QuestionResultWhereInput = {};
    if (Object.keys(questionWhere).length > 0) {
        where.question = questionWhere;
    }
    if (Object.keys(userWhere).length > 0) {
        where.user = userWhere;
    }
    return where;
};
