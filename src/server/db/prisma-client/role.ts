import type { PrismaClient, PrismaDbClient } from "~/prisma";

export class RolePrismaClient {
    // @ts-expect-error - Might be used in the future
    #prismaClient: PrismaClient;
    #db: PrismaDbClient;

    constructor(prismaClient: PrismaClient, db: PrismaDbClient) {
        this.#prismaClient = prismaClient;
        this.#db = db;
    }

    async getAll() {
        return this.#db.role.findMany();
    }
}
