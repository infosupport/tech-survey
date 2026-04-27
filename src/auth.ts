import MicrosoftEntraID from "@auth/core/providers/microsoft-entra-id";
import NextAuth from "next-auth";

import { env } from "~/env";
import { prismaClient } from "~/server/db";
import type { IPrismaAdapterService } from "~/server/db/prisma-client";
import { authConfig } from "./auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
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
});
