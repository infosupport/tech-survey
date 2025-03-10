import { PrismaClient, PrismaDbClient } from "~/prisma";

import { env } from "~/env";

// Ensure this runs ONLY on the server
if (typeof window !== "undefined") {
    throw new Error("❌ PrismaClient should not be used in the browser.");
}

const createPrismaClient = () =>
    new PrismaClient(
        new PrismaDbClient({
            log: ["error"],
        }),
    );

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prismaClient: PrismaClient =
    globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;
