"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";

export function SignOutButton() {
    const session = useSession().data;

    if (!session) {
        return null;
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
