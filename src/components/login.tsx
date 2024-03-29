"use client";

import { type Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "./svg";

export function Login({ session }: { session?: Session | null }) {
  if (!session) {
    return (
      <Button
        onClick={() => signIn("azure-ad")}
        className=" bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover"
      >
        Start survey
        <ArrowRight />
      </Button>
    );
  }

  return (
    <div className="flex items-center">
      <p>Logged in as {session.user?.name}</p>
      <Button
        className="ml-2 bg-slate-500"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Sign out
      </Button>
    </div>
  );
}
