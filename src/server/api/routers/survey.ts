import { z } from "zod";
import {
    adminProtectedProcedure,
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { checkUserAuthorization } from "~/server/api/routers/shared";
import { newSurveyObject } from "~/app/survey/upload/newSurveyObject";

export const surveysRouter = createTRPCRouter({
    getLatestSurveyId: publicProcedure.query(async ({ ctx }) => {
        return await ctx.prismaClient.surveys.getLatestSurveyId();
    }),

    uploadNewSurvey: adminProtectedProcedure
        .input(newSurveyObject)
        .mutation(async ({ ctx, input }) => {
            return await ctx.prismaClient.surveys.uploadNewSurvey(input);
        }),

    getUserAnswersWithRoles: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prismaClient.surveys.getUserAnswersWithRoles(
                input.userId,
            );
        }),

    getSurveyQuestionsCompletedPerRole: protectedProcedure
        .input(z.object({ surveyId: z.string(), userId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prismaClient.surveys.getSurveyQuestionsCompletedPerRole(
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
            return ctx.prismaClient.surveys.getCurrentSurveyPageData(
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
            return await ctx.prismaClient.questionResults.setQuestionResultForUser(
                userId,
                questionId,
                answerId,
            );
        }),
});
