import { prismaClient } from "~/server/db";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const usageMetricLogger = createTRPCRouter({
    logUsageMetric: publicProcedure
        .input(z.object({ logMessage: z.string() }))
        .mutation(async ({ input }) => {
            await prismaClient.usageMetrics.createUsageMetric(input.logMessage);
        }),
});
