import type { PrismaDbClient } from "~/prisma";

export const USER_NAME = Object.freeze("Test User");
export const USER_EMAIL = Object.freeze("a@a.com");

export class UserDbHelper {
    #db: PrismaDbClient;

    constructor(db: PrismaDbClient) {
        this.#db = db;
    }

    async createUser(name: string, email: string) {
        // Check if user already exists
        const userExists = await this.#db.user.findUnique({
            where: {
                email: email,
            },
        });

        if (userExists) {
            return userExists.id;
        }

        const user = await this.#db.user.create({
            data: {
                name: name,
                email: email,
            },
        });
        return user.id;
    }
}
