"use client";

import { type Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { ArrowRightDarkModeFriendly } from "./svg";

export function Login({ session }: { session?: Session | null }) {
    if (!session) {
        return (
            <Button
                variant="outline"
                className="ml-2"
                onClick={() => signIn("azure-ad")}
            >
                Login
                <ArrowRightDarkModeFriendly />
            </Button>
        );
    }

    return (
        <>
            <p>Logged in as {session.user?.name}</p>
            <Button
                className="ml-2 mr-2"
                variant={"outline"}
                onClick={() => signOut({ callbackUrl: "/" })}
            >
                Sign out
            </Button>
        </>
    );
}
