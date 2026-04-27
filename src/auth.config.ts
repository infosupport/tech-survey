import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { JWT } from "@auth/core/jwt";

import { env } from "~/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://authjs.dev/getting-started/typescript?framework=next-js
 */
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            groups: string[];
        } & DefaultSession["user"];
    }
}

const protectedRoutes = [
    "/find-the-expert",
    "/survey",
    "/thank-you",
    "/result",
];

const adminRoutes = ["/administrator-dashboard", "/survey/upload"];

type TokenWithGroups = {
    groups: string[];
} & JWT;

/**
 * Base auth configuration that is safe to use in the Edge Runtime (no Prisma / Node.js-only
 * imports).  The full configuration in `auth.ts` extends this with the database adapter and
 * the Microsoft Entra ID provider.
 */
export const authConfig = {
    pages: {
        signIn: "/api/signin",
    },
    callbacks: {
        // Pass the groups to the session, so the frontend can use it
        session(params) {
            const session = params.session;
            const token = params.token as TokenWithGroups;
            if (session.user) {
                session.user.id = token.sub ?? "userId";
                session.user.groups = token.groups ?? [];
            }
            return session;
        },
        // Put the groups in the token, because we can access the token in other callbacks
        jwt: async ({ token, profile }) => {
            if (profile) {
                token["groups"] = profile["groups"] ?? [];
            }
            return token;
        },
        authorized: async ({ request, auth }) => {
            const url = request.nextUrl;
            // Get the admin group from .env
            const adminGroup = env.AUTH_MICROSOFT_ENTRA_ID_ADMIN_GROUP;
            // If the request is for an admin route, check if the user is an admin
            if (adminRoutes.some((route) => url.pathname.startsWith(route))) {
                return auth?.user.groups?.includes(adminGroup);
            }
            if (
                protectedRoutes.some((route) => url.pathname.startsWith(route))
            ) {
                return !!auth;
            }
            return true;
        },
    },
    session: {
        strategy: "jwt",
    },
    /**
     * No adapter or providers here — Prisma cannot run in the Edge Runtime.  The full `auth.ts`
     * adds the Prisma adapter and the Microsoft Entra ID provider for server-side use (API routes
     * and server components).
     */
    providers: [],
    /**
     * We trust our deployment provider to set the HOST header safely.
     * @see https://authjs.dev/reference/core#trusthost
     */
    trustHost: true,
} satisfies NextAuthConfig;
