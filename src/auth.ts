import MicrosoftEntraID from "@auth/core/providers/microsoft-entra-id";
import NextAuth, { type DefaultSession } from "next-auth";

import { env } from "~/env";
import { prismaClient } from "~/server/db";
import type { IPrismaAdapterService } from "~/server/db/prisma-client";
import type { JWT } from "@auth/core/jwt";

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

const adminRoutes = ["/administrator-dashboard"];

type TokenWithGroups = {
    groups: string[];
} & JWT;

export const { auth, handlers, signIn, signOut } = NextAuth({
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
            authorization: {
                params: {
                    scope: "openid profile email", // Ensure basic scopes are present
                    groupMembershipClaims: "SecurityGroup", // Request group claims in the authorization request
                },
            },
        }),
    ],
    /**
     * We trust our deployment provider to set the HOST header safely.
     * If you don't trust your deployment provider to set the HOST header safely, you should set this to `false`.
     * @see https://authjs.dev/reference/core#trusthost
     */
    trustHost: true,
});
