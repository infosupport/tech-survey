import MicrosoftEntraID from "@auth/core/providers/microsoft-entra-id";
import NextAuth, { type DefaultSession } from "next-auth";

import { env } from "~/env";
import { prismaClient } from "~/server/db";
import type { IPrismaAdapterService } from "~/server/db/prisma-client";

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
    adapter: (
        prismaClient as unknown as IPrismaAdapterService
    ).toPrismaAdapter(),
    // We trust Microsoft Entra ID to have securely verified the email address associated with the account
    // so we allow linking accounts with the same email address.
    // Automatic account linking on sign in is not secure between arbitrary providers, so if you are using arbitrary providers, this should be set to `false`.
    // @see https://authjs.dev/reference/core/providers#allowdangerousemailaccountlinking
    providers: [
        MicrosoftEntraID({
            // Issuer isn't auto-populated by the env var yet, so set it manually
            // See https://github.com/nextauthjs/next-auth/pull/12616
            issuer: env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    /**
     * We trust our deployment provider to set the HOST header safely.
     * If you don't trust your deployment provider to set the HOST header safely, you should set this to `false`.
     * @see https://authjs.dev/reference/core#trusthost
     */
    trustHost: true,
});
