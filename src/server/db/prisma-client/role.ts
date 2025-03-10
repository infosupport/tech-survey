import type { PrismaDbClient } from "~/prisma";
import type { PrismaClient } from ".";

export class RolePrismaClient {
    // @ts-expect-error - Might be used in the future
    #prismaClient: PrismaClient;
    #db: PrismaDbClient;

    constructor(prismaClient: PrismaClient, db: PrismaDbClient) {
        this.#prismaClient = prismaClient;
        this.#db = db;
    }

    async getAll() {
        return await this.#db.role.findMany();
    }
}
