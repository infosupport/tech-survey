"use client";

import { type Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";

export function Login({ session }: { session?: Session | null }) {
  if (!session) {
    return (
      <div className="mt-5 flex flex-col items-center gap-6">
        <Button
          onClick={() => signIn("azure-ad")}
          className=" bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary"
        >
          Sign in
          <svg
            className="arrow-right ml-2"
            width="10"
            height="10"
            viewBox="0 0 4 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              id="Vector"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2.39352 3.60724H3.60801V2.39278H2.39352V3.60724Z"
              fill="#003865"
            ></path>
            <path
              id="Vector_2"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.19662 4.80365H2.41102V3.58923H1.19662V4.80365Z"
              fill="#003865"
            ></path>
            <path
              id="Vector_3"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.19662 2.41089H2.41102V1.19641H1.19662V2.41089Z"
              fill="#003865"
            ></path>
            <path
              id="Vector_4"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 6H1.21442V4.78559L0 4.78558L0 6Z"
              fill="#003865"
            ></path>
            <path
              id="Vector_5"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 1.21448H1.21442V9.50098e-05L0 -5.24521e-06L0 1.21448Z"
              fill="#003865"
            ></path>
          </svg>
        </Button>
      </div>
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
