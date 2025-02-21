import type { Role } from "~/models/types";
import { db } from "~/server/db";

export function getRoles(): () => Promise<Role[]> {
    return async () => {
        const roles: Role[] = await db.role.findMany();

        return roles.sort((a, b) => {
            const roleA = a.role.toLowerCase();
            const roleB = b.role.toLowerCase();

            if (roleA === "general") return -1;
            if (roleB === "general") return 1;

            return 0;
        });
    };
}
