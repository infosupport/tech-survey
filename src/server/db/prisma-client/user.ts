import type {
    CommunicationMethod,
    Prisma,
    PrismaClient,
    PrismaDbClient,
} from "~/prisma";
import { TRPCClientError } from "@trpc/client";

export class UserPrismaClient {
    // @ts-expect-error - Might be used in the future
    #prismaClient: PrismaClient;
    #db: PrismaDbClient;

    constructor(prismaClient: PrismaClient, db: PrismaDbClient) {
        this.#prismaClient = prismaClient;
        this.#db = db;
    }

    async getUserById(userId: string) {
        return await this.#db.user.findUnique({ where: { id: userId } });
    }

    async getUsers(): Promise<GetUsersData[]> {
        return await this.#db.user.findMany({
            select: getUsersSelect,
        });
    }

    async getUserInfo(userId: string) {
        return await this.#db.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                communicationPreferences: true,
                businessUnit: true,
                roles: true,
            },
        });
    }

    async setDefaultRoleForUser(userId: string) {
        const user = await this.#db.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                roles: true,
            },
        });

        if (!user) {
            throw new TRPCClientError("User not found");
        }

        // retrieve all default roles
        const defaultRole = await this.#db.role.findFirst({
            where: {
                default: true,
            },
        });

        if (!defaultRole) {
            throw new TRPCClientError("Default role not found");
        }

        const userRoles = user.roles;

        let hasDefaultRole = false;
        // Check if the default role is already assigned to the user
        for (const role of userRoles) {
            if (role.id === defaultRole.id) {
                hasDefaultRole = true;
            }
        }

        if (!hasDefaultRole) {
            const newRoles = userRoles.concat(defaultRole);

            await this.#db.user.update({
                where: {
                    id: userId,
                },
                data: {
                    roles: {
                        set: newRoles,
                    },
                },
            });
        }
    }

    async setCommunicationMethodsForUser(
        userId: string,
        methods: CommunicationMethod[],
    ) {
        const user = await this.#db.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                communicationPreferences: true,
            },
        });

        if (!user) {
            throw new TRPCClientError("User not found");
        }

        // Check if the user already has communication preferences
        if (user.communicationPreferences) {
            // If the user already has communication preferences, update them
            const communicationPreferenceId = user.communicationPreferences.id;

            await this.#db.communicationPreference.update({
                where: {
                    id: communicationPreferenceId,
                },
                data: {
                    methods: methods,
                },
            });
        } else {
            // If the user doesn't have communication preferences, create them
            await this.#db.communicationPreference.create({
                data: {
                    userId: userId,
                    methods: methods,
                },
            });
        }
    }

    async setBusinessUnitForUser(userId: string, businessUnitId: string) {
        try {
            const user = await this.#db.user.findUnique({
                where: {
                    id: userId,
                },
            });

            if (!user) {
                throw new TRPCClientError("User not found");
            }

            const unit = await this.#db.businessUnit.findUnique({
                where: {
                    id: businessUnitId,
                },
            });

            if (!unit) {
                throw new TRPCClientError("Invalid business unit");
            }

            await this.#db.user.update({
                where: {
                    id: userId,
                },
                data: {
                    businessUnit: {
                        connect: unit,
                    },
                },
            });
        } catch (error: unknown) {
            if (error instanceof TRPCClientError) {
                throw error;
            } else if (
                typeof error === "object" &&
                error !== null &&
                "message" in error &&
                typeof error.message === "string"
            ) {
                if (error.message.includes("ETIMEDOUT")) {
                    throw new TRPCClientError(
                        "Timeout error occurred while accessing the database",
                    );
                } else if (error.message.includes("ER_DUP_ENTRY")) {
                    throw new TRPCClientError("Duplicate entry error occurred");
                } else if (error.message.includes("ER_NO_REFERENCED_ROW")) {
                    throw new TRPCClientError(
                        "Referenced row not found error occurred",
                    );
                }
            }
            throw new TRPCClientError("An unexpected error occurred");
        }
    }

    async getRolesForUser(userId: string) {
        return await this.#db.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                roles: true,
            },
        });
    }

    async setRolesForUser(userId: string, roleIds: string[]) {
        try {
            // find the user
            const user = await this.#db.user.findUnique({
                where: {
                    id: userId,
                },
            });

            if (!user) {
                throw new TRPCClientError("User not found");
            }

            // find the roles
            const roles = await this.#db.role.findMany({
                where: {
                    id: {
                        in: roleIds,
                    },
                },
            });

            if (roles.length !== roleIds.length) {
                throw new TRPCClientError("Invalid role");
            }

            // set the roles
            await this.#db.user.update({
                where: {
                    id: userId,
                },
                data: {
                    roles: {
                        set: roles,
                    },
                },
            });
        } catch (error: unknown) {
            if (error instanceof TRPCClientError) {
                throw error;
            } else if (
                typeof error === "object" &&
                error !== null &&
                "message" in error &&
                typeof error.message === "string"
            ) {
                if (error.message.includes("ETIMEDOUT")) {
                    throw new TRPCClientError(
                        "Timeout error occurred while accessing the database",
                    );
                } else if (error.message.includes("ER_DUP_ENTRY")) {
                    throw new TRPCClientError("Duplicate entry error occurred");
                } else if (error.message.includes("ER_NO_REFERENCED_ROW")) {
                    throw new TRPCClientError(
                        "Referenced row not found error occurred",
                    );
                }
            }
            throw new TRPCClientError("An unexpected error occurred");
        }
    }

    async getProfilePageUserById(
        userId: string,
    ): Promise<ProfilePageUserData | null> {
        return await this.#db.user.findUnique({
            where: {
                id: userId,
            },
            select: profilePageUserSelect,
        });
    }
}

const profilePageUserSelect = {
    name: true,
    id: true,
    questionResults: {
        orderBy: [
            { question: { survey: { surveyDate: "desc" } } },
            { answer: { option: "asc" } },
        ],
        select: {
            answer: {
                select: {
                    option: true,
                },
            },
            question: {
                select: {
                    questionText: true,
                    survey: {
                        select: {
                            id: true,
                            surveyName: true,
                        },
                    },
                    roles: {
                        select: {
                            role: true,
                        },
                    },
                },
            },
        },
    },
    communicationPreferences: {
        select: {
            methods: true,
        },
    },
} satisfies Prisma.UserSelect;
export type ProfilePageUserData = Prisma.UserGetPayload<{
    select: typeof profilePageUserSelect;
}>;

const getUsersSelect = {
    id: true,
    name: true,
} satisfies Prisma.UserSelect;
export type GetUsersData = Prisma.UserGetPayload<{
    select: typeof getUsersSelect;
}>;
