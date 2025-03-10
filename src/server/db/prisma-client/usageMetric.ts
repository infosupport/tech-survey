import type { PrismaClient, PrismaDbClient } from "~/prisma";

export class UsageMetricPrismaClient {
    // @ts-expect-error - Might be used in the future
    #prismaClient: PrismaClient;
    #db: PrismaDbClient;

    constructor(prismaClient: PrismaClient, db: PrismaDbClient) {
        this.#prismaClient = prismaClient;
        this.#db = db;
    }

    async createUsageMetric(logMessage: string) {
        await this.#db.usageMetrics.create({
            data: {
                action: logMessage,
            },
        });
    }
}
