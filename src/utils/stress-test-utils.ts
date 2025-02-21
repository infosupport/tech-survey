import { type Session } from "next-auth";
import { db } from "~/server/db";

export async function createNewUserAndSession(): Promise<Session | null> {
    if (process.env.STRESS_TEST !== "true") return null;

    // select all users with email starting with 'test-'
    const users = await db.user.findMany({
        where: {
            email: {
                startsWith: "test-",
            },
        },
    });
    let nrOfUsers = users.length;

    while (nrOfUsers < 500) {
        const email = `test-${Math.random().toString(36).substring(7)}@test.com`;

        await db.user.create({
            data: {
                email: email,
                name: "Test User",
            },
        });

        const user = await db.user.findFirst({
            where: {
                email: email,
            },
            include: {
                roles: true,
            },
        });

        if (!user) return null;

        const defaultRole = await db.role.findFirst({
            where: {
                default: true,
            },
        });

        if (!defaultRole) return null;

        const hasDefaultRole = user.roles.some(
            (role) => role.id === defaultRole.id,
        );

        if (!hasDefaultRole) {
            await db.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    roles: {
                        connectOrCreate: {
                            where: { id: defaultRole.id },
                            create: {
                                id: defaultRole.id,
                                role: defaultRole.role,
                                default: defaultRole.default,
                            },
                        },
                    },
                },
            });
        }

        nrOfUsers++;
    }

    const randomNr = Math.floor(Math.random() * 50) + 1;
    const randomUser = users[randomNr];

    return {
        user: {
            id: randomUser?.id ?? "",
            email: randomUser?.email,
            name: randomUser?.name,
            // findExpertOptIn: true,
        },
        expires: "2025-12-31T23:59:59Z",
    };
}
