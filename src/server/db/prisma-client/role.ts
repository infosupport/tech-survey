import type { PrismaClient, PrismaDbClient } from "~/prisma";

export class RolePrismaClient {
    #prismaClient: PrismaClient;
    #db: PrismaDbClient;

    constructor(prismaClient: PrismaClient, db: PrismaDbClient) {
        this.#prismaClient = prismaClient;
        this.#db = db;
    }

    async getAll() {
        return this.#db.role.findMany();
    }

    async getCurrent() {
        const surveyId = await this.#prismaClient.surveys.getLatestSurveyId();
        if (!surveyId) {
            throw new Error("No survey found");
        }
        return this.#db.role.findMany({
            where: {
                questions: {
                    some: {
                        surveyId: surveyId,
                    },
                },
            },
        });
    }
}
