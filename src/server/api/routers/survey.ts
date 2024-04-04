import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { type Role } from "~/models/types";
import { TRPCClientError } from "@trpc/client";

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
    // await new Promise((resolve) => setTimeout(resolve, 3000));
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

  setDefaultRole: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          id: input.userId,
        },
        include: {
          roles: true, // Include the roles associated with the user
        },
      });

      if (!user) {
        throw new TRPCClientError("User not found");
      }

      const defaultRole = await ctx.db.role.findFirst({
        where: {
          default: true,
        },
      });

      if (!defaultRole) {
        throw new TRPCClientError("Default role not found");
      }

      // Check if the default role is already assigned to the user
      const hasDefaultRole = user.roles.some(
        (role) => role.id === defaultRole.id,
      );

      if (!hasDefaultRole) {
        // If the user doesn't have the default role, add it to their roles
        const updatedRoles = [...user.roles, defaultRole];

        await ctx.db.user.update({
          where: {
            id: input.userId,
          },
          data: {
            roles: {
              set: updatedRoles,
            },
          },
        });
      }
    }),

  setRole: protectedProcedure
    .input(z.object({ userId: z.string(), roleIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { userId, roleIds } = input;

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
            throw new TRPCClientError("Duplicate entry error occurred");
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
      z.array(
        z.object({
          userId: z.string(),
          questionId: z.string(),
          answerId: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await Promise.all(
          input.map(async (response) => {
            const { userId, questionId, answerId } = response;

            // find the question
            const question = await ctx.db.question.findUnique({
              where: {
                id: questionId,
              },
            });

            if (!question) {
              throw new TRPCClientError(
                `Question with ID ${questionId} not found`,
              );
            }

            // find the answer
            const answerOption = await ctx.db.answerOption.findUnique({
              where: {
                id: answerId,
              },
            });

            if (!answerOption) {
              throw new TRPCClientError(`Answer with ID ${answerId} not found`);
            }

            // find the user
            const user = await ctx.db.user.findUnique({
              where: {
                id: userId,
              },
            });

            if (!user) {
              throw new TRPCClientError(`User with ID ${userId} not found`);
            }

            // find the existing answer
            const existingAnswer = await ctx.db.questionResult.findFirst({
              where: {
                userId,
                questionId,
              },
            });

            if (existingAnswer) {
              // update the existing answer
              await ctx.db.questionResult.update({
                where: {
                  id: existingAnswer.id,
                },
                data: {
                  answerId,
                },
              });
              console.log(
                `Updated answer for user ${userId} and question ${questionId}`,
              );
            } else {
              // create a new answer
              await ctx.db.questionResult.create({
                data: {
                  userId,
                  questionId,
                  answerId,
                },
              });
              console.log(
                `Created answer for user ${userId} and question ${questionId}`,
              );
            }
          }),
        );
        console.log("All answers processed successfully");
      } catch (error) {
        console.error("Error processing answers:", error);
        throw new TRPCClientError("Failed to process all answers");
      }
    }),
});
