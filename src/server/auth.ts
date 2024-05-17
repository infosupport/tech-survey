import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "~/env";
import { db } from "~/server/db";
import { randomUUID } from "crypto";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // findExpertOptIn: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    // findExpertOptIn: boolean;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.id = account.id;
      }
      return token;
    },
    async signIn() {
      return true;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "userId";
      }
      return session;
    },
  },
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    AzureADProvider({
      clientId: env.AZURE_AD_CLIENT_ID,
      clientSecret: env.AZURE_AD_CLIENT_SECRET,
      tenantId: env.AZURE_AD_TENANT_ID,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        // 1. Create a new user in the database
        const user = await db.user.create({
          data: {
            name: credentials?.username,
          },
        });

        // 3. Assign a session to the user
        await db.session.create({
          data: {
            userId: user?.id ?? "userId",
            sessionToken: randomUUID(),
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        // 4. Create an Account database entry
        await db.account.create({
          data: {
            userId: user?.id ?? "userId",
            type: "credentials",
            provider: "credentials",
            providerAccountId: randomUUID(),
          },
        });

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
