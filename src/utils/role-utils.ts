import type { Role } from "~/models/types";

export const sortRoles = (roles: Role[]) => {
    return roles.sort((a, b) => {
        const roleA = a.role.toLowerCase();
        const roleB = b.role.toLowerCase();

        if (roleA === "general") return -1;
        if (roleB === "general") return 1;

        return 0;
    });
};
