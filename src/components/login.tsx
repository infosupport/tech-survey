"use client";

import { type Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "./svg";

export function Login({
    session,
    text,
}: {
    session?: Session | null;
    text: string;
}) {
    if (!session) {
        return (
            <Button
                onClick={() => signIn("azure-ad")}
                className=" bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover"
            >
                {text}
                <ArrowRight />
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
