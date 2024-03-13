import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { type Role } from "~/models/types";

export const surveyRouter = createTRPCRouter({
  getQuestions: publicProcedure.query(async ({ ctx }) => {
    // get all questions and also the roles associated with each question
    const questions = await ctx.db.question.findMany({
      include: {
        roles: true,
      },
    });
    // await new Promise((resolve) => setTimeout(resolve, 10000));
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
        throw new Error("User not found");
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

  setRole: protectedProcedure
    .input(z.object({ userId: z.string(), roleIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { userId, roleIds } = input;

      // find the user
      const user = await ctx.db.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new Error("User not found");
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
        throw new Error("Invalid role");
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
    }),

  setQuestionResult: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        questionId: z.string(),
        answerId: z.string(),
      }),
    )
    // create new or update an existing answer
    .mutation(async ({ ctx, input }) => {
      const { userId, questionId, answerId } = input;

      // find the question
      const question = await ctx.db.question.findUnique({
        where: {
          id: questionId,
        },
      });

      if (!question) {
        throw new Error("Question not found");
      }

      // find the answer
      const answerOption = await ctx.db.answerOption.findUnique({
        where: {
          id: answerId,
        },
      });

      if (!answerOption) {
        throw new Error("Answer not found");
      }

      // find the user
      const user = await ctx.db.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new Error("User not found");
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
        console.log("Updated answer");
      } else {
        // create a new answer
        await ctx.db.questionResult.create({
          data: {
            userId,
            questionId,
            answerId,
          },
        });
      }
      console.log("Created answer");
    }),
});
