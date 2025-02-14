import { createTRPCRouter, publicProcedure } from "./api/trpc";
import { z } from "zod";
import { db } from "./db";

export const usageMetricLogger = createTRPCRouter({
  logUsageMetric: publicProcedure
    .input(z.object({ logMessage: z.string() }))
    .mutation(async ({ input }) => {
      await db.usageMetrics.create({
        data: {
          action: input.logMessage,
        },
      });
    }),
});
