import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { type Role } from "~/models/types";
import { TRPCClientError } from "@trpc/client";
import { CommunicationMethod } from "@prisma/client";
import type { Session } from "next-auth";

// Users can only make requests for themselves
const checkUserAuthorisation = (session: Session, userId: string) => {
    if (session.user.id !== userId) {
        throw new TRPCClientError("User not authorised");
    }
};

export const surveyRouter = createTRPCRouter({
    getQuestions: publicProcedure.query(async ({ ctx }) => {
        // get all questions and also the roles associated with each question
        const questions = await ctx.db.question.findMany({
            include: {
                roles: true,
            },
        });
        return questions;
    }),

    getAnswerOptions: publicProcedure.query(async ({ ctx }) => {
        const answerOptions = await ctx.db.answerOption.findMany();
        return answerOptions;
    }),

    getRoles: publicProcedure.query(async ({ ctx }) => {
        const roles = await ctx.db.role.findMany();
        return roles;
    }),

    getUserSelectedRoles: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({
                where: {
                    id: input.userId,
                },
                include: {
                    roles: true,
                },
            });

            if (!user) {
                throw new TRPCClientError("User not found");
            }

            return user.roles as Role[];
        }),

    getUserInfo: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.db.user.findUnique({
                where: {
                    id: input.userId,
                },
                include: {
                    communicationPreferences: true,
                    businessUnit: true,
                    roles: true,
                },
            });
        }),

    getUserAnswersForRole: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const userAnswers = await ctx.db.questionResult.findMany({
                where: {
                    userId: input.userId,
                },
                include: {
                    question: {
                        include: {
                            roles: true,
                        },
                    },
                },
            });

            return userAnswers;
        }),

    getSurveyQuestionsCompletedPerRole: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const userRolesWithQuestions = await ctx.db.role.findMany({
                where: {
                    users: {
                        some: {
                            id: input.userId,
                        },
                    },
                },
                include: {
                    questions: {
                        include: {
                            QuestionResult: {
                                where: {
                                    userId: input.userId,
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
        }),

    getSurveyPageData: protectedProcedure
        .input(z.object({ userId: z.string(), role: z.string() }))
        .query(async ({ ctx, input }) => {
            const roles = await ctx.db.role.findMany({
                where: {
                    users: {
                        some: {
                            id: input.userId,
                        },
                    },
                },
            });

            const questions = await ctx.db.question.findMany({
                where: {
                    roles: {
                        some: {
                            role: {
                                equals: input.role,
                                mode: "insensitive",
                            },
                        },
                    },
                },
                include: {
                    roles: true,
                    QuestionResult: {
                        where: {
                            userId: input.userId,
                        },
                        include: {
                            question: true,
                        },
                    },
                },
            });

            const answerOptions = await ctx.db.answerOption.findMany();

            const userAnswersForRole = await ctx.db.questionResult.findMany({
                where: {
                    userId: input.userId,
                    question: {
                        roles: {
                            some: {
                                role: {
                                    equals: input.role,
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

            return { questions, answerOptions, roles, userAnswersForRole };
        }),

    setDefaultRole: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            checkUserAuthorisation(ctx.session, input.userId);
            const user = await ctx.db.user.findUnique({
                where: {
                    id: input.userId,
                },
                select: {
                    roles: true,
                },
            });

            if (!user) {
                throw new TRPCClientError("User not found");
            }

            // retrieve all default roles

            const defaultRole = await ctx.db.role.findFirst({
                where: {
                    default: true,
                },
            });

            if (!defaultRole) {
                throw new TRPCClientError("Default role not found");
            }

            const userRoles = user.roles;

            let hasDefaultRole = false;
            // Check if the default role is already assigned to the user
            for (const role of userRoles) {
                if (role.id === defaultRole.id) {
                    hasDefaultRole = true;
                }
            }

            if (!hasDefaultRole) {
                const newRoles = userRoles.concat(defaultRole);

                await ctx.db.user.update({
                    where: {
                        id: input.userId,
                    },
                    data: {
                        roles: {
                            set: newRoles,
                        },
                    },
                });
            }
        }),

    setCommunicationMethods: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                methods: z.array(z.nativeEnum(CommunicationMethod)),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            checkUserAuthorisation(ctx.session, input.userId);
            const user = await ctx.db.user.findUnique({
                where: {
                    id: input.userId,
                },
                include: {
                    communicationPreferences: true,
                },
            });

            if (!user) {
                throw new TRPCClientError("User not found");
            }

            // Check if the user already has communication preferences
            if (user.communicationPreferences) {
                // If the user already has communication preferences, update them
                const communicationPreferenceId =
                    user.communicationPreferences.id;

                await ctx.db.communicationPreference.update({
                    where: {
                        id: communicationPreferenceId,
                    },
                    data: {
                        methods: input.methods,
                    },
                });
            } else {
                // If the user doesn't have communication preferences, create them
                await ctx.db.communicationPreference.create({
                    data: {
                        userId: input.userId,
                        methods: input.methods,
                    },
                });
            }
        }),

    setBusinessUnit: protectedProcedure
        .input(z.object({ userId: z.string(), businessUnitId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { userId, businessUnitId } = input;
            checkUserAuthorisation(ctx.session, userId);

            try {
                const user = await ctx.db.user.findUnique({
                    where: {
                        id: userId,
                    },
                });

                if (!user) {
                    throw new TRPCClientError("User not found");
                }

                const unit = await ctx.db.businessUnit.findUnique({
                    where: {
                        id: businessUnitId,
                    },
                });

                if (!unit) {
                    throw new TRPCClientError("Invalid business unit");
                }

                await ctx.db.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        businessUnit: {
                            connect: unit,
                        },
                    },
                });
            } catch (error: unknown) {
                if (error instanceof TRPCClientError) {
                    throw error;
                } else if (
                    typeof error === "object" &&
                    error !== null &&
                    "message" in error &&
                    typeof error.message === "string"
                ) {
                    if (error.message.includes("ETIMEDOUT")) {
                        throw new TRPCClientError(
                            "Timeout error occurred while accessing the database",
                        );
                    } else if (error.message.includes("ER_DUP_ENTRY")) {
                        throw new TRPCClientError(
                            "Duplicate entry error occurred",
                        );
                    } else if (error.message.includes("ER_NO_REFERENCED_ROW")) {
                        throw new TRPCClientError(
                            "Referenced row not found error occurred",
                        );
                    }
                }
                throw new TRPCClientError("An unexpected error occurred");
            }
        }),

    setRole: protectedProcedure
        .input(z.object({ userId: z.string(), roleIds: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const { userId, roleIds } = input;
            checkUserAuthorisation(ctx.session, userId);

            try {
                // find the user
                const user = await ctx.db.user.findUnique({
                    where: {
                        id: userId,
                    },
                });

                if (!user) {
                    throw new TRPCClientError("User not found");
                }

                // find the roles
                const roles = await ctx.db.role.findMany({
                    where: {
                        id: {
                            in: roleIds,
                        },
                    },
                });

                if (roles.length !== roleIds.length) {
                    throw new TRPCClientError("Invalid role");
                }

                // set the roles
                await ctx.db.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        roles: {
                            set: roles,
                        },
                    },
                });
            } catch (error: unknown) {
                if (error instanceof TRPCClientError) {
                    throw error;
                } else if (
                    typeof error === "object" &&
                    error !== null &&
                    "message" in error &&
                    typeof error.message === "string"
                ) {
                    if (error.message.includes("ETIMEDOUT")) {
                        throw new TRPCClientError(
                            "Timeout error occurred while accessing the database",
                        );
                    } else if (error.message.includes("ER_DUP_ENTRY")) {
                        throw new TRPCClientError(
                            "Duplicate entry error occurred",
                        );
                    } else if (error.message.includes("ER_NO_REFERENCED_ROW")) {
                        throw new TRPCClientError(
                            "Referenced row not found error occurred",
                        );
                    }
                }
                throw new TRPCClientError("An unexpected error occurred");
            }
        }),

    setQuestionResult: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                questionId: z.string(),
                answerId: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { userId, questionId, answerId } = input;
            checkUserAuthorisation(ctx.session, userId);
            try {
                const [questionExists, answerOptionExists, userExists] =
                    await Promise.all([
                        ctx.db.question.count({
                            where: {
                                id: questionId,
                            },
                        }),
                        ctx.db.answerOption.count({
                            where: {
                                id: answerId,
                            },
                        }),
                        ctx.db.user.count({
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
                    throw new TRPCClientError(
                        `User with ID ${userId} not found`,
                    );
                }

                const existingQuestionResult =
                    await ctx.db.questionResult.findFirst({
                        where: {
                            userId: userId,
                            questionId: questionId,
                        },
                    });

                await ctx.db.questionResult.upsert({
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
        }),
});
