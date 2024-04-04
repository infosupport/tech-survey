"use client";

import type { Session } from "next-auth";
import { Login } from "./login";
import { Button } from "./ui/button";
import { ArrowRight } from "./svg";
import { signIn } from "next-auth/react";

const Buttons = ({ session }: { session: Session | null }) => {
  return (
    <div className="mt-5 flex justify-center">
      <div className="mt-5 flex flex-col items-center gap-6 md:flex-row">
        <Login session={session} text="Go to survey" />
        <Button
          onClick={() => signIn("azure-ad", { callbackUrl: "/result/general" })}
          className="bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover"
        >
          Show anonymised results
          <ArrowRight />
        </Button>
        <Button
          onClick={() =>
            signIn("azure-ad", { callbackUrl: "/management/general" })
          }
          className=" bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover"
        >
          Find the Expert
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
};

export default Buttons;
