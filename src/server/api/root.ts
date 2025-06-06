import { surveysRouter } from "~/server/api/routers/survey";
import { usersRouter } from "~/server/api/routers/user";
import { createTRPCRouter } from "~/server/api/trpc";
import { usageMetricLogger } from "~/server/log";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    users: usersRouter,
    surveys: surveysRouter,
    usageMetricLogger: usageMetricLogger,
});

// export type definition of API
export type AppRouter = typeof appRouter;
