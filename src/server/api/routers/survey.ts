import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { checkUserAuthorization } from "./shared";

export const surveysRouter = createTRPCRouter({
    getLatestSurveyId: publicProcedure.query(async ({ ctx }) => {
        return await ctx.db.surveys.getLatestSurveyId();
    }),

    getUserAnswersWithRoles: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.db.surveys.getUserAnswersWithRoles(input.userId);
        }),

    getSurveyQuestionsCompletedPerRole: protectedProcedure
        .input(z.object({ surveyId: z.string(), userId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.db.surveys.getSurveyQuestionsCompletedPerRole(
                input.surveyId,
                input.userId,
            );
        }),

    getCurrentSurveyPageData: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                role: z.string(),
            }),
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.surveys.getCurrentSurveyPageData(
                input.userId,
                input.role,
            );
        }),
    setQuestionResultForUser: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                questionId: z.string(),
                answerId: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { userId, questionId, answerId } = input;
            checkUserAuthorization(ctx.session, userId);
            return await ctx.db.questionResults.setQuestionResultForUser(
                userId,
                questionId,
                answerId,
            );
        }),
});
