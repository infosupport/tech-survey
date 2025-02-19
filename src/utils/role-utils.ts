import type { Role, Section } from "~/models/types";
import { db } from "~/server/db";
import { slugify } from "./slugify";

export function generateRolesWithHref(
    resultHref: string,
): () => Promise<Section[]> {
    return async () => {
        const roles: Role[] = await db.role.findMany();

        const availableRoles: Section[] = roles
            .sort((a, b) => {
                const roleA = a.role.toLowerCase();
                const roleB = b.role.toLowerCase();

                if (roleA === "general") return -1;
                if (roleB === "general") return 1;

                return 0;
            })
            .map((role) => ({
                id: role.id,
                href: createHref(resultHref, role),
                label: role.role,
                current: false,
                completed: false,
                started: false,
                currentCompleted: false,
            }));

        return availableRoles;
    };
}

const createHref = (path: string, role: Role) => {
    if (path.includes("result")) {
        return `${path}/${slugify(role.role)}`;
    }
    return `${path}?role=${role.role}`;
};
