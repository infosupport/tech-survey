import { surveyRouter } from "~/server/api/routers/survey";
import { createTRPCRouter } from "~/server/api/trpc";
import { usageMetricLogger } from "../log";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  survey: surveyRouter,
  usageMetricLogger: usageMetricLogger,
});

// export type definition of API
export type AppRouter = typeof appRouter;
