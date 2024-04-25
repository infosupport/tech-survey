"use client";

import type { Session } from "next-auth";
import { Login } from "./login";
import { Button } from "./ui/button";
import { ArrowRightDarkModeFriendly } from "./svg";
import { signIn } from "next-auth/react";

const Buttons = ({ session }: { session: Session | null }) => {
  return (
    <div className="mt-5 flex justify-center">
      <div className="mt-5 flex flex-col items-center gap-6 md:flex-row">
        {!session && (
          <>
            <Login session={session} text="Go to survey" />
            <Button
              onClick={() =>
                signIn("azure-ad", { callbackUrl: "/result/general" })
              }
              variant="outline"
              className="border-2 border-[#bed62f]"
            >
              Show anonymised results
              <ArrowRightDarkModeFriendly />
            </Button>
            <Button
              onClick={() =>
                signIn("azure-ad", { callbackUrl: "/find-the-expert/general" })
              }
              variant="outline"
              className="border-2 border-[#bed62f]"
            >
              Find the Expert
              <ArrowRightDarkModeFriendly />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Buttons;
