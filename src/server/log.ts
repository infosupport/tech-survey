import { createTRPCRouter, publicProcedure } from "./api/trpc";
import { z } from "zod";
import { prismaClient } from "./db";

export const usageMetricLogger = createTRPCRouter({
    logUsageMetric: publicProcedure
        .input(z.object({ logMessage: z.string() }))
        .mutation(async ({ input }) => {
            await prismaClient.usageMetrics.createUsageMetric(input.logMessage);
        }),
});
