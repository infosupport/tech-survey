import type { Adapter } from "@auth/core/adapters";
import MicrosoftEntraID from "@auth/core/providers/microsoft-entra-id";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type DefaultSession } from "next-auth";

import { db } from "~/server/db";

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
        } & DefaultSession["user"];
    }
}

const protectedRoutes = [
    "/find-the-expert",
    "/survey",
    "/thank-you",
    "/result",
];

export const { auth, handlers, signIn, signOut } = NextAuth({
    pages: {
        signIn: "/api/signin",
    },
    callbacks: {
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub ?? "userId";
            }
            return session;
        },
        authorized: async ({ request, auth }) => {
            const url = request.nextUrl;
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
    adapter: PrismaAdapter(db) as Adapter,
    providers: [MicrosoftEntraID],
});
