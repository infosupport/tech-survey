import { PrismaClient, PrismaDbClient } from "~/prisma";

import { env } from "~/env";

// Ensure this runs ONLY on the server
if (typeof window !== "undefined") {
    throw new Error("❌ PrismaClient should not be used in the browser.");
}

const createPrismaClient = (prismaDbClient?: PrismaDbClient) => {
    return new PrismaClient(
        prismaDbClient ??
            new PrismaDbClient({
                log: ["error"],
            }),
    );
};

const createPrismaDbClient = () => {
    return new PrismaDbClient({
        log: ["error"],
    });
};

declare const globalThis: {
    prismaDbClient: ReturnType<typeof createPrismaDbClient>;
} & typeof global;

export const prismaClient: PrismaClient = createPrismaClient(
    globalThis.prismaDbClient,
);

if (env.NODE_ENV !== "production") {
    globalThis.prismaDbClient =
        globalThis.prismaDbClient ?? createPrismaDbClient();
}
