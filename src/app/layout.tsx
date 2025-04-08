import "~/styles/globals.css";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/toaster";

import { Inter } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { ModeToggle } from "~/components/mode-toggle";
import Link from "next/link";
import GithubLink from "~/components/github-link";
import { HomeLink } from "~/components/home-link";
import { SignOutButton } from "~/components/sign-out-button";
import { auth } from "~/auth";
import { SessionProvider } from "next-auth/react";
import { Button } from "~/components/ui/button";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata = {
    title: {
        template: "%s | Info Support Tech Survey - 2024",
        default: "Info Support Tech Survey - 2024",
    },
    description: "Info Support Tech Survey - 2024",
    icons: [{ rel: "icon", url: "/favicon.png" }],
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const adminGroup = process.env["AUTH_MICROSOFT_ENTRA_ID_ADMIN_GROUP"];
    const userIsAdmin =
        !!adminGroup && session?.user.groups?.includes(adminGroup);

    return (
        <html lang="en" suppressHydrationWarning={true}>
            <body
                className={cn(
                    "min-h-screen bg-background font-sans antialiased",
                    inter.variable,
                )}
                suppressHydrationWarning={true}
            >
                <SessionProvider session={session}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <TRPCReactProvider>
                            <main className="min-h-screen items-center justify-center">
                                <div className="mx-auto flex flex-wrap items-center justify-between p-4">
                                    <HomeLink />
                                    <div className="flex-grow"></div>
                                    <SignOutButton />
                                    <ModeToggle />
                                    <GithubLink />
                                    {userIsAdmin && (
                                        <Link
                                            href="/administrator-dashboard"
                                            className="ml-2 mr-2"
                                        >
                                            <Button variant="outline">
                                                Administrator dashboard
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                                {children}
                                <div className="text-center">
                                    <p className="text-md mb-8">
                                        Your privacy is important to us. We
                                        invite you to read our{" "}
                                        <Link
                                            className="underline"
                                            href={"/privacy"}
                                        >
                                            Privacy Statement
                                        </Link>{" "}
                                        to understand how we protect and handle
                                        your personal information.
                                    </p>
                                </div>
                            </main>
                        </TRPCReactProvider>
                        <Toaster />
                    </ThemeProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
