import "~/styles/globals.css";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/toaster";

import { Inter } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { Suspense } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { Login } from "~/components/login";
import { type Session } from "next-auth";
import { getServerAuthSession } from "~/server/auth";
import ButtonSkeleton from "~/components/loading/button-loader";
import { Button } from "~/components/ui/button";
import { ArrowLeftDarkModeFriendly } from "~/components/svg";
import Link from "next/link";
import { headers } from "next/headers";

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

function getNextUrl() {
  const headersList = headers();
  const nextUrl = headersList.get("next-url");
  return nextUrl;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
        )}
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <main className="min-h-screen items-center justify-center">
              <div className="mx-auto flex flex-wrap items-center justify-between p-4">
                {/* only show this back to home button if the getNextUrl is not '/' */}
                {getNextUrl() !== "/" && (
                  <Link href="/" passHref>
                    <Button variant="outline">
                      <ArrowLeftDarkModeFriendly />
                      Back to home
                    </Button>
                  </Link>
                )}

                <div className="flex-grow"></div>
                {session && (
                  <Suspense fallback={<ButtonSkeleton />}>
                    <LoginWrapper session={session} />
                  </Suspense>
                )}
                <ModeToggle />
              </div>
              {children}
              <div className="text-center">
                <p className="text-md mb-8">
                  Your privacy is important to us. We invite you to read our{" "}
                  <Link className="underline" href={"/privacy"}>
                    Privacy Statement
                  </Link>{" "}
                  to understand how we protect and handle your personal
                  information.
                </p>
              </div>
            </main>
          </TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

const LoginWrapper: React.FC<{ session: Session }> = async ({ session }) => {
  return <Login session={session} text="Go to survey" />;
};
