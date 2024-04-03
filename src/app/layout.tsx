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
  const session = await getServerAuthSession();
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <main className="flex min-h-screen items-center justify-center">
              <div className="absolute right-4 top-4 z-50 flex items-center space-x-4">
                {session && (
                  <Suspense fallback={<ButtonSkeleton />}>
                    <LoginWrapper session={session} />
                  </Suspense>
                )}
                <ModeToggle />
              </div>
              {children}
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
